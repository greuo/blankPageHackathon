-- Access-model checks: impersonates each seeded demo user and asserts what RLS lets them see and do.
-- Run as postgres (Supabase SQL editor, or `psql -f`). Needs the data from seed.sql.
-- Write checks roll themselves back, so this is safe to run against the shared project.
-- Output: one row per check; every row must have pass = true.

drop table if exists pg_temp.results;
create temp table results (n serial, check_name text, expected bigint, actual bigint);
grant insert on results to authenticated, anon;
grant usage on sequence results_n_seq to authenticated, anon;

-- Runs `stmt` as the current role, records whether it was allowed, then undoes it.
-- Allowed = no error and at least one row affected.
create function pg_temp.try_write(check_name text, expected_allowed boolean, stmt text) returns void
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
    when insufficient_privilege or check_violation or unique_violation or raise_exception then
      if sqlstate <> 'P0001' then allowed := false; end if;
  end;
  insert into results (check_name, expected, actual) values (check_name, expected_allowed::int, allowed::int);
end $$;

-- ---------------------------------------------------------------- Alex (patient, Dr. Kim + Nurse Lee)
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000041","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Alex: sees only own conversation', 1, count(*) from conversations union all
select 'Alex: sees own 3 messages', 3, count(*) from messages union all
select 'Alex: sees no escalations', 0, count(*) from escalations union all
select 'Alex: sees self + care team (Kim, Lee)', 3, count(*) from profiles union all
select 'Alex: sees only own patient row', 1, count(*) from patients;
select pg_temp.try_write('Alex: can write in own chat', true,
  $q$insert into messages (conversation_id, sender_type, sender_id, content)
     values ('00000000-0000-0000-0000-0000000000c1', 'patient', '00000000-0000-0000-0000-000000000041', 'hi')$q$);
select pg_temp.try_write('Alex: cannot write in Jordan''s chat', false,
  $q$insert into messages (conversation_id, sender_type, sender_id, content)
     values ('00000000-0000-0000-0000-0000000000c2', 'patient', '00000000-0000-0000-0000-000000000041', 'hi')$q$);
select pg_temp.try_write('Alex: cannot post as the bot', false,
  $q$insert into messages (conversation_id, sender_type, content)
     values ('00000000-0000-0000-0000-0000000000c1', 'bot', 'fake bot reply')$q$);
select pg_temp.try_write('Alex: cannot change own role', false,
  $q$update profiles set role = 'doctor' where id = '00000000-0000-0000-0000-000000000041'$q$);
select pg_temp.try_write('Alex: can rename self', true,
  $q$update profiles set full_name = 'Alex R.' where id = '00000000-0000-0000-0000-000000000041'$q$);
select pg_temp.try_write('Alex: cannot escalate directly', false,
  $q$insert into escalations (conversation_id, reason) values ('00000000-0000-0000-0000-0000000000c1', 'x')$q$);

-- ---------------------------------------------------------------- Dr. Kim (treated Alex and Jordan)
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000021","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Kim: sees Alex + Jordan conversations', 2, count(*) from conversations union all
select 'Kim: sees their 5 messages', 5, count(*) from messages union all
select 'Kim: sees own hospital''s escalation only', 1, count(*) from escalations union all
select 'Kim: sees Alex + Jordan patient rows', 2, count(*) from patients union all
select 'Kim: cannot see Sam''s chat', 0, count(*) from messages where conversation_id = '00000000-0000-0000-0000-0000000000c3';

-- ---------------------------------------------------------------- Dr. Patel (treated Sam, not Jordan)
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000022","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Patel: sees Sam (assigned) + Jordan (escalated)', 2, count(*) from conversations union all
select 'Patel: sees escalated Jordan chat', 2, count(*) from messages where conversation_id = '00000000-0000-0000-0000-0000000000c2' union all
select 'Patel: cannot see Alex''s chat (not escalated)', 0, count(*) from messages where conversation_id = '00000000-0000-0000-0000-0000000000c1' union all
select 'Patel: sees hospital escalation', 1, count(*) from escalations union all
select 'Patel: sees Sam + Jordan patient rows', 2, count(*) from patients;
select pg_temp.try_write('Patel: can claim any hospital escalation', true,
  $q$update escalations set status = 'claimed' where id = '00000000-0000-0000-0000-0000000000e1'$q$);
select pg_temp.try_write('Patel: cannot reassign routed_to', false,
  $q$update escalations set routed_to = '00000000-0000-0000-0000-000000000022' where id = '00000000-0000-0000-0000-0000000000e1'$q$);
select pg_temp.try_write('Patel: can reply in escalated chat', true,
  $q$insert into messages (conversation_id, sender_type, sender_id, content)
     values ('00000000-0000-0000-0000-0000000000c2', 'staff', '00000000-0000-0000-0000-000000000022', 'Please come in today.')$q$);
select pg_temp.try_write('Patel: cannot reply in Alex''s chat', false,
  $q$insert into messages (conversation_id, sender_type, sender_id, content)
     values ('00000000-0000-0000-0000-0000000000c1', 'staff', '00000000-0000-0000-0000-000000000022', 'hi')$q$);

-- ---------------------------------------------------------------- Nurse Lee (on Alex's team)
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000031","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Lee: sees Alex''s conversation only', 1, count(*) from conversations union all
select 'Lee: sees Alex''s 3 messages', 3, count(*) from messages union all
select 'Lee: no escalations (Jordan not hers)', 0, count(*) from escalations union all
select 'Lee: sees Alex''s patient row only', 1, count(*) from patients;
select pg_temp.try_write('Lee: can reply in Alex''s chat', true,
  $q$insert into messages (conversation_id, sender_type, sender_id, content)
     values ('00000000-0000-0000-0000-0000000000c1', 'staff', '00000000-0000-0000-0000-000000000031', 'Drink plenty of water.')$q$);
select pg_temp.try_write('Lee: cannot claim escalations', false,
  $q$update escalations set status = 'claimed' where id = '00000000-0000-0000-0000-0000000000e1'$q$);

-- ---------------------------------------------------------------- Admin (Blank Page General)
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000011","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Admin: reads no messages', 0, count(*) from messages union all
select 'Admin: reads no conversations', 0, count(*) from conversations union all
select 'Admin: reads no escalations', 0, count(*) from escalations union all
select 'Admin: sees all 3 hospital patients', 3, count(*) from patients union all
select 'Admin: sees all 7 hospital profiles', 7, count(*) from profiles;
select pg_temp.try_write('Admin: can add Patel to Alex''s care team', true,
  $q$insert into care_assignments (patient_id, staff_id)
     values ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000022')$q$);
select pg_temp.try_write('Admin: cannot touch other hospital''s care team', false,
  $q$insert into care_assignments (patient_id, staff_id)
     values ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000051')$q$);
select pg_temp.try_write('Admin: can change primary doctor', true,
  $q$update patients set primary_doctor_id = '00000000-0000-0000-0000-000000000022' where id = '00000000-0000-0000-0000-000000000041'$q$);

-- ---------------------------------------------------------------- Dr. Reyes (other hospital)
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000051","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Reyes: sees only Casey''s conversation', 1, count(*) from conversations union all
select 'Reyes: sees only own hospital''s escalation', 1, count(*) from escalations union all
select 'Reyes: sees no Blank Page General profiles', 0, count(*) from profiles where hospital_id = '00000000-0000-0000-0000-0000000000a1' union all
select 'Reyes: sees no Blank Page General hospital', 0, count(*) from hospitals where id = '00000000-0000-0000-0000-0000000000a1';
select pg_temp.try_write('Reyes: cannot claim other hospital''s escalation', false,
  $q$update escalations set status = 'claimed' where id = '00000000-0000-0000-0000-0000000000e1'$q$);

-- ---------------------------------------------------------------- Not signed in
reset request.jwt.claims;
set role anon;
insert into results (check_name, expected, actual)
select 'anon: reads no profiles', 0, count(*) from profiles union all
select 'anon: reads no messages', 0, count(*) from messages;

reset role;
select n, check_name, expected, actual, expected = actual as pass from results order by n;
