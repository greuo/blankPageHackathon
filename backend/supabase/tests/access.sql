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

reset role;
reset request.jwt.claims;

-- ---------------------------------------------------------------- Sign-up trigger (as postgres)
select pg_temp.try_signup('Sign-up: email user gets a patients row named from metadata',
  '00000000-0000-0000-0000-000000000901', 'signup.check@demo.example.com', false,
  '{"display_name":"Riley Test"}', 'Riley Test');
select pg_temp.try_signup('Sign-up: guest (anonymous) gets a patients row too',
  '00000000-0000-0000-0000-000000000902', null, true,
  '{}', null);

-- ---------------------------------------------------------------- Realtime
insert into results (check_name, expected, actual)
select 'Realtime publishes messages and care_notes', 2, count(*)
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('messages', 'care_notes');

select n, check_name, expected, actual, expected = actual as pass from results order by n;
