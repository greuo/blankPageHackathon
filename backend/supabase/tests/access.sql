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

-- ---------------------------------------------------------------- Jordan (patient, Dr. Kim; Dr. Patel replied after escalation)
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000042","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Jordan: sees self + Kim (team) + Patel (replied)', 3, count(*) from profiles union all
select 'Jordan: still no escalation rows', 0, count(*) from escalations;

-- ---------------------------------------------------------------- Dr. Kim (treated Alex and Jordan)
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000021","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Kim: sees Alex + Jordan conversations', 2, count(*) from conversations union all
select 'Kim: sees their 6 messages', 6, count(*) from messages union all
select 'Kim: sees own hospital''s escalation only', 1, count(*) from escalations union all
select 'Kim: sees Alex + Jordan patient rows', 2, count(*) from patients union all
select 'Kim: cannot see Sam''s chat', 0, count(*) from messages where conversation_id = '00000000-0000-0000-0000-0000000000c3';

-- ---------------------------------------------------------------- Dr. Patel (treated Sam, not Jordan)
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000022","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Patel: sees Sam (assigned) + Jordan (escalated)', 2, count(*) from conversations union all
select 'Patel: sees escalated Jordan chat', 3, count(*) from messages where conversation_id = '00000000-0000-0000-0000-0000000000c2' union all
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

-- ================================================================ Chatbot: notes, decisions, alerts
-- Seed: notes b1-b3 for Alex, b4 for Jordan; one bot decision in Alex's chat; alerts for Kim (e1)
-- and Reyes (e2).

set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000041","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Alex: reads no bot notes', 0, count(*) from bot_knowledge union all
select 'Alex: reads no bot decisions', 0, count(*) from bot_decisions union all
select 'Alex: reads no alerts', 0, count(*) from alerts union all
select 'Alex: own chat not handed off', 0, conversation_handed_off('00000000-0000-0000-0000-0000000000c1')::int;
select pg_temp.try_write('Alex: cannot write bot notes', false,
  $q$insert into bot_knowledge (patient_id, title, content) values ('00000000-0000-0000-0000-000000000041', 'x', 'y')$q$);

set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000042","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Jordan: own escalated chat is handed off', 1, conversation_handed_off('00000000-0000-0000-0000-0000000000c2')::int union all
select 'Jordan: no handoff status for Casey''s chat', 0, conversation_handed_off('00000000-0000-0000-0000-0000000000c4')::int;

set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000021","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Kim: reads Alex + Jordan notes', 4, count(*) from bot_knowledge union all
select 'Kim: reads Alex''s bot decision', 1, count(*) from bot_decisions union all
select 'Kim: has the Jordan escalation alert', 1, count(*) from alerts where escalation_id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.try_write('Kim: can add a note for Alex', true,
  $q$insert into bot_knowledge (patient_id, title, content) values ('00000000-0000-0000-0000-000000000041', 'Diet', 'No restrictions.')$q$);
select pg_temp.try_write('Kim: cannot add a note for Sam (not on team)', false,
  $q$insert into bot_knowledge (patient_id, title, content) values ('00000000-0000-0000-0000-000000000043', 'x', 'y')$q$);
select pg_temp.try_write('Kim: can mark own alert read', true,
  $q$update alerts set read_at = now() where recipient_id = '00000000-0000-0000-0000-000000000021'$q$);
select pg_temp.try_write('Kim: cannot reassign an alert', false,
  $q$update alerts set recipient_id = '00000000-0000-0000-0000-000000000022' where recipient_id = '00000000-0000-0000-0000-000000000021'$q$);
select pg_temp.try_write('Kim: cannot write bot decisions', false,
  $q$insert into bot_decisions (conversation_id, message_id, action)
     select conversation_id, id, 'answered' from messages where conversation_id = '00000000-0000-0000-0000-0000000000c1' limit 1$q$);

set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000022","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Patel: reads Jordan''s note (escalated) only', 1, count(*) from bot_knowledge union all
select 'Patel: no alerts (not Jordan''s doctor)', 0, count(*) from alerts union all
select 'Patel: no bot decisions (Alex not his)', 0, count(*) from bot_decisions;
select pg_temp.try_write('Patel: cannot add a note for Jordan (escalated, not on team)', false,
  $q$insert into bot_knowledge (patient_id, title, content) values ('00000000-0000-0000-0000-000000000042', 'x', 'y')$q$);
select pg_temp.try_write('Patel: cannot edit Jordan''s note', false,
  $q$update bot_knowledge set title = 'x' where id = '00000000-0000-0000-0000-0000000000b4'$q$);
select pg_temp.try_write('Patel: cannot mark Kim''s alert read', false,
  $q$update alerts set read_at = now() where recipient_id = '00000000-0000-0000-0000-000000000021'$q$);

set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000031","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Lee: reads Alex''s 3 notes', 3, count(*) from bot_knowledge union all
select 'Lee: reads Alex''s bot decision', 1, count(*) from bot_decisions union all
select 'Lee: no alerts (nurse)', 0, count(*) from alerts;
select pg_temp.try_write('Lee: can add a note for Alex', true,
  $q$insert into bot_knowledge (patient_id, title, content) values ('00000000-0000-0000-0000-000000000041', 'Ice', 'Ice 20 minutes at a time.')$q$);
select pg_temp.try_write('Lee: can deactivate Alex''s note', true,
  $q$update bot_knowledge set active = false where id = '00000000-0000-0000-0000-0000000000b1'$q$);
select pg_temp.try_write('Lee: cannot add a note for Jordan', false,
  $q$insert into bot_knowledge (patient_id, title, content) values ('00000000-0000-0000-0000-000000000042', 'x', 'y')$q$);
select pg_temp.try_write('Lee: cannot set a note''s author', false,
  $q$insert into bot_knowledge (patient_id, title, content, author_id)
     values ('00000000-0000-0000-0000-000000000041', 'x', 'y', '00000000-0000-0000-0000-000000000021')$q$);

set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000011","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Admin: reads no bot notes', 0, count(*) from bot_knowledge union all
select 'Admin: reads no bot decisions', 0, count(*) from bot_decisions union all
select 'Admin: reads no alerts', 0, count(*) from alerts;

set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000051","role":"authenticated"}';
insert into results (check_name, expected, actual)
select 'Reyes: has the Casey escalation alert', 1, count(*) from alerts where escalation_id = '00000000-0000-0000-0000-0000000000e2' union all
select 'Reyes: reads no Blank Page General notes', 0, count(*) from bot_knowledge;

-- ---------------------------------------------------------------- Not signed in
reset request.jwt.claims;
set role anon;
insert into results (check_name, expected, actual)
select 'anon: reads no profiles', 0, count(*) from profiles union all
select 'anon: reads no messages', 0, count(*) from messages;

reset role;

-- ---------------------------------------------------------------- Triggers (as postgres)
do $$
declare stale boolean;
begin
  begin
    update escalations set status = 'resolved' where id = '00000000-0000-0000-0000-0000000000e1';
    update escalations set status = 'open' where id = '00000000-0000-0000-0000-0000000000e1';
    select resolved_at is not null into stale from escalations where id = '00000000-0000-0000-0000-0000000000e1';
    raise exception using errcode = 'P0001', message = 'undo';
  exception when raise_exception then null;
  end;
  insert into results (check_name, expected, actual) values ('Reopening clears resolved_at', 0, stale::int);
end $$;

do $$
declare
  sam_escalation uuid;
  sam_alerts bigint;
  unread_after_resolve bigint;
  moved boolean := true;
begin
  begin
    -- Sam: primary doctor and only care-team doctor is Patel.
    insert into escalations (conversation_id, reason) values ('00000000-0000-0000-0000-0000000000c3', 'test')
    returning id into sam_escalation;
    select count(*) into sam_alerts from alerts
    where escalation_id = sam_escalation and recipient_id = '00000000-0000-0000-0000-000000000022';
    raise exception using errcode = 'P0001', message = 'undo';
  exception when raise_exception then null;
  end;
  insert into results (check_name, expected, actual) values ('New escalation alerts the patient''s doctor', 1, sam_alerts);

  begin
    update escalations set status = 'resolved' where id = '00000000-0000-0000-0000-0000000000e1';
    select count(*) into unread_after_resolve from alerts
    where escalation_id = '00000000-0000-0000-0000-0000000000e1' and read_at is null;
    raise exception using errcode = 'P0001', message = 'undo';
  exception when raise_exception then null;
  end;
  insert into results (check_name, expected, actual) values ('Resolving clears the escalation''s alerts', 0, unread_after_resolve);

  begin
    update bot_knowledge set patient_id = '00000000-0000-0000-0000-000000000042' where id = '00000000-0000-0000-0000-0000000000b1';
  exception when raise_exception then moved := false;
  end;
  insert into results (check_name, expected, actual) values ('A note can''t move to another patient', 0, moved::int);
end $$;

select n, check_name, expected, actual, expected = actual as pass from results order by n;
