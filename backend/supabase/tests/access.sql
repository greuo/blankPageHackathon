-- Access checks for the patient-only model: impersonates the seeded demo patients (and a visitor who
-- isn't signed in) and asserts what RLS and the column grants let each of them see and do.
-- Run as postgres (Supabase SQL editor, or `psql -f`). Needs the data from seed.sql; the counts
-- assume the demo accounts haven't been used since, so rerun seed.sql first if they have.
-- Every write is undone, so this is safe to run against the shared project.
-- Output: one row per check; every row must have pass = true.
--
-- Alex  ...0101  email account. Dr. Okafor (...0201), care notes v1 + v2, 6 messages, 1 doctor message
-- Sam   ...0102  guest (anonymous sign-in). Dr. Martins (...0202), care notes v1, 4 messages, 1 QR link

drop table if exists pg_temp.results;
create temp table results (n serial, check_name text, expected bigint, actual bigint);
grant insert on results to authenticated, anon;
grant usage on sequence results_n_seq to authenticated, anon;

-- Runs `stmt` as the current role, records whether it was allowed, then undoes it.
-- Allowed = no error and at least one row affected.
create or replace function pg_temp.try_write(check_name text, expected_allowed boolean, stmt text) returns void
language plpgsql as $$
declare
  allowed boolean := false;
  affected bigint;
begin
  begin
    execute stmt;
    get diagnostics affected = row_count;
    allowed := affected > 0;
    raise exception using errcode = 'P0001', message = 'undo';
  exception
    when insufficient_privilege or check_violation or unique_violation or foreign_key_violation
      or not_null_violation or raise_exception then
      if sqlstate <> 'P0001' then allowed := false; end if;
  end;
  insert into results (check_name, expected, actual) values (check_name, expected_allowed::int, allowed::int);
end $$;

-- Runs `stmt` as the current role, records the one bigint it returns (e.g. `insert ... returning
-- version`, or `select count(*)`), then undoes it. An error (or no row) records -1.
create or replace function pg_temp.try_value(check_name text, expected_value bigint, stmt text) returns void
language plpgsql as $$
declare
  got bigint;
begin
  begin
    execute stmt into got;
    raise exception using errcode = 'P0001', message = 'undo';
  exception
    when insufficient_privilege or check_violation or unique_violation or foreign_key_violation
      or not_null_violation or raise_exception then
      if sqlstate <> 'P0001' then got := -1; end if;
  end;
  insert into results (check_name, expected, actual) values (check_name, expected_value, coalesce(got, -1));
end $$;

-- Inserts an auth user the way a sign-up does (run as postgres), records whether the sign-up
-- trigger gave it a patients row with the expected display name, then undoes it.
create or replace function pg_temp.try_signup(
  check_name text, p_id uuid, p_email text, p_anonymous boolean, p_meta jsonb, p_expected_name text
) returns void
language plpgsql as $$
declare
  ok boolean := false;
begin
  begin
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, is_anonymous,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email, '', p_anonymous,
      case when p_anonymous then '{"provider":"anonymous","providers":["anonymous"]}'::jsonb
           else '{"provider":"email","providers":["email"]}'::jsonb end,
      p_meta, now(), now()
    );
    select count(*) = 1 into ok from public.patients p
    where p.id = p_id and p.display_name is not distinct from p_expected_name;
    raise exception using errcode = 'P0001', message = 'undo';
  exception
    when others then
      if sqlstate <> 'P0001' then
        ok := false;
        raise notice '%: % (%)', check_name, sqlerrm, sqlstate;
      end if;
  end;
  insert into results (check_name, expected, actual) values (check_name, 1, ok::int);
end $$;

-- ---------------------------------------------------------------- Alex (email account)
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated","is_anonymous":false}';

insert into results (check_name, expected, actual)
select 'Alex: sees 1 patient row', 1, count(*) from patients union all
select 'Alex: ...and it is own', 1, count(*) from patients where id = '00000000-0000-0000-0000-000000000101' union all
select 'Alex: sees own 1 doctor', 1, count(*) from doctors union all
select 'Alex: sees own 2 care note versions', 2, count(*) from care_notes union all
select 'Alex: current_care_notes has 1 row', 1, count(*) from current_care_notes union all
select 'Alex: current notes are version 2', 2, coalesce(max(version), 0) from current_care_notes union all
select 'Alex: sees own 6 messages', 6, count(*) from messages union all
select 'Alex: sees own 1 doctor message', 1, count(*) from doctor_messages union all
select 'Alex: sees no QR links', 0, count(*) from entry_links union all
select 'Alex: no Sam patient row', 0, count(*) from patients where id = '00000000-0000-0000-0000-000000000102' union all
select 'Alex: no Sam doctors', 0, count(*) from doctors where patient_id = '00000000-0000-0000-0000-000000000102' union all
select 'Alex: no Sam care notes', 0, count(*) from care_notes where patient_id = '00000000-0000-0000-0000-000000000102' union all
select 'Alex: no Sam current notes', 0, count(*) from current_care_notes where patient_id = '00000000-0000-0000-0000-000000000102' union all
select 'Alex: no Sam messages', 0, count(*) from messages where patient_id = '00000000-0000-0000-0000-000000000102' union all
select 'Alex: no Sam doctor messages', 0, count(*) from doctor_messages where patient_id = '00000000-0000-0000-0000-000000000102' union all
select 'Alex: no Sam QR links', 0, count(*) from entry_links where patient_id = '00000000-0000-0000-0000-000000000102';

-- Doctors
select pg_temp.try_write('Alex: can add a doctor', true,
  $q$insert into doctors (name, email, clinic, clinic_phone)
     values ('Dr. Priya Shah', 'priya.shah@example.com', 'Harbor Family Clinic', '555-0142')$q$);
select pg_temp.try_write('Alex: can edit own doctor', true,
  $q$update doctors set clinic_phone = '555-0143' where id = '00000000-0000-0000-0000-000000000201'$q$);
select pg_temp.try_write('Alex: can remove own doctor', true,
  $q$delete from doctors where id = '00000000-0000-0000-0000-000000000201'$q$);
select pg_temp.try_write('Alex: cannot add a doctor for Sam', false,
  $q$insert into doctors (patient_id, name) values ('00000000-0000-0000-0000-000000000102', 'Dr. Fake')$q$);
select pg_temp.try_write('Alex: cannot move own doctor to Sam', false,
  $q$update doctors set patient_id = '00000000-0000-0000-0000-000000000102' where id = '00000000-0000-0000-0000-000000000201'$q$);
select pg_temp.try_write('Alex: cannot edit Sam''s doctor', false,
  $q$update doctors set name = 'Dr. Fake' where id = '00000000-0000-0000-0000-000000000202'$q$);
select pg_temp.try_write('Alex: cannot remove Sam''s doctor', false,
  $q$delete from doctors where id = '00000000-0000-0000-0000-000000000202'$q$);

-- Care notes
select pg_temp.try_value('Alex: saving notes makes version 3', 3,
  $q$insert into care_notes (doctor_id, content)
     values ('00000000-0000-0000-0000-000000000201', '{"reason":"Check-up"}') returning version$q$);
select pg_temp.try_write('Alex: cannot save notes marked as from the QR link', false,
  $q$insert into care_notes (doctor_id, content, entered_via)
     values ('00000000-0000-0000-0000-000000000201', '{"reason":"Check-up"}', 'qr')$q$);
select pg_temp.try_write('Alex: cannot pick the version number', false,
  $q$insert into care_notes (doctor_id, content, version)
     values ('00000000-0000-0000-0000-000000000201', '{"reason":"Check-up"}', 99)$q$);
select pg_temp.try_write('Alex: cannot cite Sam''s doctor in own notes', false,
  $q$insert into care_notes (doctor_id, content)
     values ('00000000-0000-0000-0000-000000000202', '{"reason":"Check-up"}')$q$);
select pg_temp.try_write('Alex: cannot save notes for Sam', false,
  $q$insert into care_notes (patient_id, doctor_id, content)
     values ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000202', '{"reason":"Fake"}')$q$);
select pg_temp.try_write('Alex: cannot edit a saved version', false,
  $q$update care_notes set content = '{"reason":"Edited"}' where id = '00000000-0000-0000-0000-000000000302'$q$);
select pg_temp.try_write('Alex: can delete an own version', true,
  $q$delete from care_notes where id = '00000000-0000-0000-0000-000000000301'$q$);
select pg_temp.try_write('Alex: cannot delete Sam''s care notes', false,
  $q$delete from care_notes where patient_id = '00000000-0000-0000-0000-000000000102'$q$);
select pg_temp.try_value('Alex: deleting the latest version doesn''t reuse its number (next is 3)', 3,
  $q$with gone as (delete from care_notes where id = '00000000-0000-0000-0000-000000000302' returning 1)
     insert into care_notes (doctor_id, content)
     select '00000000-0000-0000-0000-000000000201', '{"reason":"Check-up"}' from gone returning version$q$);
select pg_temp.try_write('Alex: cannot change own version counter', false,
  $q$update patients set last_note_version = 0 where id = '00000000-0000-0000-0000-000000000101'$q$);

-- Chat
select pg_temp.try_write('Alex: can write a patient message', true,
  $q$insert into messages (content) values ('Thanks!')$q$);
select pg_temp.try_write('Alex: cannot write a bot message', false,
  $q$insert into messages (sender, content) values ('bot', 'Fake bot reply')$q$);
select pg_temp.try_write('Alex: cannot write a message for Sam', false,
  $q$insert into messages (patient_id, content) values ('00000000-0000-0000-0000-000000000102', 'hi')$q$);
select pg_temp.try_write('Alex: cannot delete Sam''s messages', false,
  $q$delete from messages where patient_id = '00000000-0000-0000-0000-000000000102'$q$);

-- Doctor messages and QR links are written by edge functions only
select pg_temp.try_write('Alex: cannot create doctor messages', false,
  $q$insert into doctor_messages (patient_id, doctor_id, content, token_hash)
     values ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'hi', 'not-a-real-hash')$q$);
select pg_temp.try_write('Alex: cannot mark a doctor message opened', false,
  $q$update doctor_messages set opened_at = now() where patient_id = '00000000-0000-0000-0000-000000000101'$q$);
select pg_temp.try_write('Alex: cannot create QR links', false,
  $q$insert into entry_links (patient_id, token_hash) values ('00000000-0000-0000-0000-000000000101', 'not-a-real-hash')$q$);

-- Own patient row
select pg_temp.try_write('Alex: can rename self', true,
  $q$update patients set display_name = 'Alex R.' where id = '00000000-0000-0000-0000-000000000101'$q$);
select pg_temp.try_write('Alex: cannot change own patient id', false,
  $q$update patients set id = gen_random_uuid() where id = '00000000-0000-0000-0000-000000000101'$q$);
select pg_temp.try_write('Alex: cannot rename Sam', false,
  $q$update patients set display_name = 'Fake' where id = '00000000-0000-0000-0000-000000000102'$q$);

-- ---------------------------------------------------------------- Sam (guest: anonymous sign-in)
-- Same role as an email account; only the is_anonymous claim differs. RLS must treat them the same.
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000102","role":"authenticated","is_anonymous":true}';

insert into results (check_name, expected, actual)
select 'Sam (guest): sees 1 patient row', 1, count(*) from patients union all
select 'Sam (guest): ...and it is own', 1, count(*) from patients where id = '00000000-0000-0000-0000-000000000102' union all
select 'Sam (guest): sees own 1 doctor', 1, count(*) from doctors union all
select 'Sam (guest): sees own 1 care note version', 1, count(*) from care_notes union all
select 'Sam (guest): current_care_notes has 1 row', 1, count(*) from current_care_notes union all
select 'Sam (guest): current notes are version 1', 1, coalesce(max(version), 0) from current_care_notes union all
select 'Sam (guest): sees own 4 messages', 4, count(*) from messages union all
select 'Sam (guest): sees no doctor messages', 0, count(*) from doctor_messages union all
select 'Sam (guest): sees own 1 QR link', 1, count(*) from entry_links union all
select 'Sam (guest): no Alex patient row', 0, count(*) from patients where id = '00000000-0000-0000-0000-000000000101' union all
select 'Sam (guest): no Alex doctors', 0, count(*) from doctors where patient_id = '00000000-0000-0000-0000-000000000101' union all
select 'Sam (guest): no Alex care notes', 0, count(*) from care_notes where patient_id = '00000000-0000-0000-0000-000000000101' union all
select 'Sam (guest): no Alex current notes', 0, count(*) from current_care_notes where patient_id = '00000000-0000-0000-0000-000000000101' union all
select 'Sam (guest): no Alex messages', 0, count(*) from messages where patient_id = '00000000-0000-0000-0000-000000000101' union all
select 'Sam (guest): no Alex doctor messages', 0, count(*) from doctor_messages where patient_id = '00000000-0000-0000-0000-000000000101' union all
select 'Sam (guest): no Alex QR links', 0, count(*) from entry_links where patient_id = '00000000-0000-0000-0000-000000000101';

select pg_temp.try_write('Sam (guest): can add a doctor', true,
  $q$insert into doctors (name, clinic, clinic_phone) values ('Dr. Ana Silva', 'Bayside Urgent Care', '555-0187')$q$);
select pg_temp.try_write('Sam (guest): can edit own doctor', true,
  $q$update doctors set email = 'leo.martins.md@example.com' where id = '00000000-0000-0000-0000-000000000202'$q$);
select pg_temp.try_value('Sam (guest): saving notes makes version 2', 2,
  $q$insert into care_notes (doctor_id, content)
     values ('00000000-0000-0000-0000-000000000202', '{"reason":"Stitch check"}') returning version$q$);
select pg_temp.try_write('Sam (guest): can write a patient message', true,
  $q$insert into messages (content) values ('Thanks!')$q$);
select pg_temp.try_write('Sam (guest): can rename self', true,
  $q$update patients set display_name = 'Sam C.' where id = '00000000-0000-0000-0000-000000000102'$q$);
select pg_temp.try_write('Sam (guest): cannot write a bot message', false,
  $q$insert into messages (sender, content) values ('bot', 'Fake bot reply')$q$);
select pg_temp.try_write('Sam (guest): cannot add a doctor for Alex', false,
  $q$insert into doctors (patient_id, name) values ('00000000-0000-0000-0000-000000000101', 'Dr. Fake')$q$);
select pg_temp.try_write('Sam (guest): cannot edit Alex''s doctor', false,
  $q$update doctors set name = 'Dr. Fake' where id = '00000000-0000-0000-0000-000000000201'$q$);
select pg_temp.try_write('Sam (guest): cannot save notes for Alex', false,
  $q$insert into care_notes (patient_id, doctor_id, content)
     values ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', '{"reason":"Fake"}')$q$);
select pg_temp.try_write('Sam (guest): cannot delete Alex''s care notes', false,
  $q$delete from care_notes where patient_id = '00000000-0000-0000-0000-000000000101'$q$);
select pg_temp.try_write('Sam (guest): cannot write a message for Alex', false,
  $q$insert into messages (patient_id, content) values ('00000000-0000-0000-0000-000000000101', 'hi')$q$);
select pg_temp.try_write('Sam (guest): cannot rename Alex', false,
  $q$update patients set display_name = 'Fake' where id = '00000000-0000-0000-0000-000000000101'$q$);

-- The rate limiter is for the service role only: signed-in users can't call it or read its counters.
select pg_temp.try_value('Sam (guest): cannot call the rate limiter (-1 = denied)', -1,
  $q$select count(*) from public.hit_rate_limits(array['access-check'], array[60], array[1])$q$);
select pg_temp.try_value('Sam (guest): cannot read the rate-limit counters (-1 = denied)', -1,
  $q$select count(*) from private.rate_limits$q$);

-- ---------------------------------------------------------------- Not signed in
set role anon;
set request.jwt.claims = '{"role":"anon"}';

insert into results (check_name, expected, actual)
select 'anon: reads no patients', 0, count(*) from patients union all
select 'anon: reads no doctors', 0, count(*) from doctors union all
select 'anon: reads no care notes', 0, count(*) from care_notes union all
select 'anon: reads no messages', 0, count(*) from messages union all
select 'anon: reads no doctor messages', 0, count(*) from doctor_messages union all
select 'anon: reads no QR links', 0, count(*) from entry_links;
-- anon has no grant on the view at all, so reading it is an error (-1).
select pg_temp.try_value('anon: current_care_notes is permission denied (-1)', -1,
  $q$select count(*) from current_care_notes$q$);
select pg_temp.try_write('anon: cannot write a message', false,
  $q$insert into messages (patient_id, content) values ('00000000-0000-0000-0000-000000000101', 'hi')$q$);
select pg_temp.try_write('anon: cannot add a doctor', false,
  $q$insert into doctors (patient_id, name) values ('00000000-0000-0000-0000-000000000101', 'Dr. Fake')$q$);
select pg_temp.try_write('anon: cannot save care notes', false,
  $q$insert into care_notes (patient_id, doctor_id, content)
     values ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', '{"reason":"Fake"}')$q$);

select pg_temp.try_value('anon: cannot call the rate limiter (-1 = denied)', -1,
  $q$select count(*) from public.hit_rate_limits(array['access-check'], array[60], array[1])$q$);
select pg_temp.try_value('anon: cannot read the rate-limit counters (-1 = denied)', -1,
  $q$select count(*) from private.rate_limits$q$);

reset role;
reset request.jwt.claims;

-- ---------------------------------------------------------------- Sign-up trigger (as postgres)
select pg_temp.try_signup('Sign-up: email user gets a patients row named from metadata',
  '00000000-0000-0000-0000-000000000901', 'signup.check@demo.example.com', false,
  '{"display_name":"Riley Test"}', 'Riley Test');
select pg_temp.try_signup('Sign-up: guest (anonymous) gets a patients row too',
  '00000000-0000-0000-0000-000000000902', null, true,
  '{}', null);

-- ---------------------------------------------------------------- Doctor-message limits (as postgres)
-- notify-doctor writes with the service role, so the limits are checked as a privileged writer.
select pg_temp.try_write('Limits: email patient can message their doctor', true,
  $q$insert into doctor_messages (patient_id, doctor_id, content, token_hash)
     values ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'hi', 'check-1')$q$);
select pg_temp.try_write('Limits: guest cannot message their doctor (must add an email)', false,
  $q$insert into doctor_messages (patient_id, doctor_id, content, token_hash)
     values ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000202', 'hi', 'check-2')$q$);
select pg_temp.try_write('Limits: cannot send without a doctor', false,
  $q$insert into doctor_messages (patient_id, content, token_hash)
     values ('00000000-0000-0000-0000-000000000101', 'hi', 'check-3')$q$);
select pg_temp.try_write('Limits: 5 messages in an hour are allowed', true,
  $q$insert into doctor_messages (patient_id, doctor_id, content, token_hash)
     select '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'hi', 'hour-' || i
     from generate_series(1, 5) i$q$);
select pg_temp.try_write('Limits: a 6th message in the same hour is blocked', false,
  $q$insert into doctor_messages (patient_id, doctor_id, content, token_hash)
     select '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'hi', 'hour-' || i
     from generate_series(1, 6) i$q$);
-- The seeded doctor message is over a day old, so it doesn't count towards today's cap of 10.
select pg_temp.try_write('Limits: up to 10 messages a day to one doctor address', true,
  $q$insert into doctor_messages (patient_id, doctor_id, content, token_hash, created_at)
     select '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'hi', 'day-' || i,
            now() - interval '2 hours'
     from generate_series(1, 10) i$q$);
select pg_temp.try_write('Limits: an 11th message that day to the same address is blocked', false,
  $q$insert into doctor_messages (patient_id, doctor_id, content, token_hash, created_at)
     select '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'hi', 'day-' || i,
            now() - interval '2 hours'
     from generate_series(1, 11) i$q$);

select pg_temp.try_value('Limits: the recipient address is stored on the message', 1,
  $q$insert into doctor_messages (patient_id, doctor_id, content, token_hash)
     values ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'hi', 'addr-1')
     returning (recipient_email = 'maya.okafor@example.com')::int$q$);
-- Editing the doctor's email and re-adding the address as a new doctor must not reset the count.
create or replace function pg_temp.recipient_cap_bypass() returns bigint language plpgsql as $$
declare d uuid;
begin
  insert into public.doctor_messages (patient_id, doctor_id, content, token_hash, created_at)
  select '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'hi', 'bypass-' || i,
         now() - interval '2 hours'
  from generate_series(1, 10) i;
  update public.doctors set email = 'someone.else@example.com' where id = '00000000-0000-0000-0000-000000000201';
  insert into public.doctors (patient_id, name, email)
  values ('00000000-0000-0000-0000-000000000101', 'Dr. Again', 'Maya.Okafor@example.com') returning id into d;
  insert into public.doctor_messages (patient_id, doctor_id, content, token_hash)
  values ('00000000-0000-0000-0000-000000000101', d, 'hi', 'bypass-11');
  return 1;
end $$;
select pg_temp.try_value('Limits: editing the doctor row doesn''t reset the per-address cap (-1 = blocked)', -1,
  $q$select pg_temp.recipient_cap_bypass()$q$);

-- ---------------------------------------------------------------- Rate limiter (as postgres)
-- The edge functions call hit_rate_limits with the service role. Each helper runs a short sequence of
-- calls inside one check (now() doesn't move within a transaction, so a window can't roll over
-- halfway), and try_value undoes the counters afterwards.
create or replace function pg_temp.rl_blocked_calls(k text, w integer, mx integer, times integer) returns bigint
language plpgsql as $$
declare c bigint; total bigint := 0;
begin
  for i in 1 .. times loop
    select count(*) into c from public.hit_rate_limits(array[k], array[w], array[mx]);
    total := total + c;
  end loop;
  return total;
end $$;

create or replace function pg_temp.rl_hits_after(k text, w integer, mx integer, times integer) returns bigint
language plpgsql as $$
begin
  perform pg_temp.rl_blocked_calls(k, w, mx, times);
  return (select hits from private.rate_limits where key = k and window_seconds = w);
end $$;

-- Two limits [5, 1]: the second call is stopped by the second one, and must give back its increment
-- on the first. Returns first-counter-hits * 10 + blocked position.
create or replace function pg_temp.rl_rollback() returns bigint
language plpgsql as $$
declare pos integer;
begin
  perform 1 from public.hit_rate_limits(array['rl:c1', 'rl:c2'], array[60, 60], array[5, 1]);
  select blocked into pos from public.hit_rate_limits(array['rl:c1', 'rl:c2'], array[60, 60], array[5, 1]);
  return (select hits from private.rate_limits where key = 'rl:c1') * 10 + coalesce(pos, 0);
end $$;

-- Same key, two window lengths: separate counters. Call 3 is stopped by the 60 s window; call 2 must not be.
create or replace function pg_temp.rl_windows() returns bigint
language plpgsql as $$
declare total bigint := 0; c bigint;
begin
  select count(*) into c from public.hit_rate_limits(array['rl:w'], array[60], array[1]);   total := total + c;
  select count(*) into c from public.hit_rate_limits(array['rl:w'], array[3600], array[1]); total := total + c;
  select count(*) into c from public.hit_rate_limits(array['rl:w'], array[60], array[1]);   total := total + c;
  return total;
end $$;

create or replace function pg_temp.rl_bad_input(kind int) returns bigint
language plpgsql as $$
begin
  if kind = 1 then perform public.hit_rate_limits(array['a', 'b'], array[60], array[1]);        -- lengths differ
  elsif kind = 2 then perform public.hit_rate_limits(array['a'], array[0], array[1]);             -- window too short
  elsif kind = 3 then perform public.hit_rate_limits(array['a'], array[86401], array[1]);         -- window over a day
  elsif kind = 4 then perform public.hit_rate_limits(array['a'], array[60], array[-1]);           -- negative max
  elsif kind = 5 then perform public.hit_rate_limits(array[''], array[60], array[1]);             -- empty key
  else perform public.hit_rate_limits(array[]::text[], array[]::integer[], array[]::integer[]);   -- nothing to check
  end if;
  return 0;
exception when others then
  return 1;
end $$;

select pg_temp.try_value('Rate limiter: max calls per window pass (3 calls, max 3 -> 0 blocked)', 0,
  $q$select pg_temp.rl_blocked_calls('rl:a', 60, 3, 3)$q$);
select pg_temp.try_value('Rate limiter: the call over the max is blocked (4 calls, max 3 -> 1 blocked)', 1,
  $q$select pg_temp.rl_blocked_calls('rl:a', 60, 3, 4)$q$);
select pg_temp.try_value('Rate limiter: stays blocked until the window ends (10 calls, max 3 -> 7 blocked)', 7,
  $q$select pg_temp.rl_blocked_calls('rl:a', 60, 3, 10)$q$);
select pg_temp.try_value('Rate limiter: blocked calls are not counted (5 calls, max 2 -> counter is 2)', 2,
  $q$select pg_temp.rl_hits_after('rl:b', 60, 2, 5)$q$);
select pg_temp.try_value('Rate limiter: a blocked call undoes its earlier increments (counter 1, blocked at 2 -> 12)', 12,
  $q$select pg_temp.rl_rollback()$q$);
select pg_temp.try_value('Rate limiter: a max of 0 blocks at once', 1,
  $q$select pg_temp.rl_blocked_calls('rl:zero', 60, 0, 1)$q$);
select pg_temp.try_value('Rate limiter: window lengths of one key count separately (-> 1 blocked)', 1,
  $q$select pg_temp.rl_windows()$q$);
select pg_temp.try_value('Rate limiter: different keys count separately (2 keys x 2 calls, max 2 -> 0 blocked)', 0,
  $q$select pg_temp.rl_blocked_calls('rl:k1', 60, 2, 2) + pg_temp.rl_blocked_calls('rl:k2', 60, 2, 2)$q$);
select pg_temp.try_value('Rate limiter: retry_after is within the window (1-60 s)', 1,
  $q$select (select retry_after between 1 and 60 from public.hit_rate_limits(array['rl:r'], array[60], array[0]))::int$q$);
select pg_temp.try_value('Rate limiter: array lengths must match', 1, $q$select pg_temp.rl_bad_input(1)$q$);
select pg_temp.try_value('Rate limiter: window under 1 s is rejected', 1, $q$select pg_temp.rl_bad_input(2)$q$);
select pg_temp.try_value('Rate limiter: window over a day is rejected', 1, $q$select pg_temp.rl_bad_input(3)$q$);
select pg_temp.try_value('Rate limiter: negative max is rejected', 1, $q$select pg_temp.rl_bad_input(4)$q$);
select pg_temp.try_value('Rate limiter: empty key is rejected', 1, $q$select pg_temp.rl_bad_input(5)$q$);
select pg_temp.try_value('Rate limiter: an empty list is rejected', 1, $q$select pg_temp.rl_bad_input(6)$q$);
insert into results (check_name, expected, actual)
select 'Rate limiter: only the service role can execute it (anon, authenticated: no)', 0, count(*)
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'hit_rate_limits'
  and grantee in ('anon', 'authenticated', 'PUBLIC');
insert into results (check_name, expected, actual)
select 'Rate limiter: service_role can execute it', 1, count(*)
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'hit_rate_limits' and grantee = 'service_role';

-- ---------------------------------------------------------------- Default privileges
insert into results (check_name, expected, actual)
select 'Future public tables: no write grants for anon/authenticated by default', 0, count(*)
from pg_default_acl d, aclexplode(d.defaclacl) a
join pg_roles r on r.oid = a.grantee
where d.defaclnamespace = 'public'::regnamespace and d.defaclobjtype = 'r'
  and d.defaclrole = 'postgres'::regrole
  and r.rolname in ('anon', 'authenticated')
  and a.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');

-- ---------------------------------------------------------------- Realtime
insert into results (check_name, expected, actual)
select 'Realtime publishes messages and care_notes', 2, count(*)
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('messages', 'care_notes');

select n, check_name, expected, actual, expected = actual as pass from results order by n;
