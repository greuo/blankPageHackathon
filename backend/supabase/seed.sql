-- Demo data for the access model. Fixed UUIDs so tests and the frontend can refer to them.
--
-- Password for every demo account: 'local-demo-only' for a local `supabase db reset`.
-- On the hosted project the real demo password lives in backend/.env.local (ask Andrew);
-- seed there with `set seed.demo_password_hash = '<bcrypt hash>';` before running this file.
--
-- Blank Page General (hospital 1)
--   admin@general.example.com    admin
--   dr.kim@general.example.com   doctor, treated Alex and Jordan
--   dr.patel@general.example.com doctor, treated Sam
--   nurse.lee@general.example.com nurse, on Alex's care team
--   alex / jordan / sam @general.example.com   patients
-- Riverside Clinic (hospital 2, only here to prove hospitals can't see each other)
--   dr.reyes@riverside.example.com doctor
--   casey@riverside.example.com    patient
--
-- Conversations: Alex (no escalation), Jordan (escalated → Dr. Kim; Dr. Patel, not on Jordan's
-- team, replied), Sam (no escalation),
-- Casey (escalated → Dr. Reyes).
-- Bot notes: three for Alex, one for Jordan. Escalations raise alerts for Dr. Kim (Jordan) and
-- Dr. Reyes (Casey) through the escalations_alert trigger.

insert into public.hospitals (id, name) values
  ('00000000-0000-0000-0000-0000000000a1', 'Blank Page General'),
  ('00000000-0000-0000-0000-0000000000a2', 'Riverside Clinic');

create temp table demo_users (id uuid, email text, role public.user_role, full_name text, hospital_id uuid);
insert into demo_users values
  ('00000000-0000-0000-0000-000000000011', 'admin@general.example.com',     'admin',   'Morgan Admin', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000021', 'dr.kim@general.example.com',    'doctor',  'Dr. Kim',      '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000022', 'dr.patel@general.example.com',  'doctor',  'Dr. Patel',    '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000031', 'nurse.lee@general.example.com', 'nurse',   'Nurse Lee',    '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000041', 'alex@general.example.com',      'patient', 'Alex Rivera',  '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000042', 'jordan@general.example.com',    'patient', 'Jordan Smith', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000043', 'sam@general.example.com',       'patient', 'Sam Chen',     '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000051', 'dr.reyes@riverside.example.com','doctor',  'Dr. Reyes',    '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-000000000061', 'casey@riverside.example.com',   'patient', 'Casey Park',   '00000000-0000-0000-0000-0000000000a2');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  coalesce(
    nullif(current_setting('seed.demo_password_hash', true), ''),
    extensions.crypt('local-demo-only', extensions.gen_salt('bf'))
  ),
  now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', full_name), now(), now(),
  '', '', '', ''
from demo_users;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now()
from demo_users;

insert into public.profiles (id, hospital_id, role, full_name, email)
select id, hospital_id, role, full_name, email from demo_users;

insert into public.patients (id, hospital_id, date_of_birth, mrn, primary_doctor_id) values
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-0000000000a1', '1988-04-12', 'BPG-1001', '00000000-0000-0000-0000-000000000021'),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-0000000000a1', '1975-09-30', 'BPG-1002', '00000000-0000-0000-0000-000000000021'),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-0000000000a1', '2001-01-05', 'BPG-1003', '00000000-0000-0000-0000-000000000022'),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-0000000000a2', '1993-06-21', 'RC-2001',  '00000000-0000-0000-0000-000000000051');

insert into public.care_assignments (patient_id, staff_id) values
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000021'), -- Alex: Dr. Kim
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000031'), -- Alex: Nurse Lee
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000021'), -- Jordan: Dr. Kim
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000022'), -- Sam: Dr. Patel
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000051'); -- Casey: Dr. Reyes

insert into public.conversations (id, patient_id) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000041'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000042'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000043'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-000000000061');

insert into public.messages (conversation_id, sender_type, sender_id, content, created_at) values
  ('00000000-0000-0000-0000-0000000000c1', 'patient', '00000000-0000-0000-0000-000000000041', 'Is it normal to feel tired after the new medication?', now() - interval '50 minutes'),
  ('00000000-0000-0000-0000-0000000000c1', 'bot',     null, 'Mild tiredness is a common side effect in the first week. Let me know if it gets worse.', now() - interval '49 minutes'),
  ('00000000-0000-0000-0000-0000000000c1', 'patient', '00000000-0000-0000-0000-000000000041', 'Thanks, that helps.', now() - interval '48 minutes'),
  ('00000000-0000-0000-0000-0000000000c2', 'patient', '00000000-0000-0000-0000-000000000042', 'My stitches look red and swollen and I have a fever.', now() - interval '20 minutes'),
  ('00000000-0000-0000-0000-0000000000c2', 'bot',     null, 'That could be an infection. I have forwarded this to your care team.', now() - interval '19 minutes'),
  ('00000000-0000-0000-0000-0000000000c2', 'staff',   '00000000-0000-0000-0000-000000000022', 'This is Dr. Patel. Please come in to the clinic today so we can take a look.', now() - interval '15 minutes'),
  ('00000000-0000-0000-0000-0000000000c3', 'patient', '00000000-0000-0000-0000-000000000043', 'When can I start exercising again?', now() - interval '10 minutes'),
  ('00000000-0000-0000-0000-0000000000c3', 'bot',     null, 'Most patients can resume light exercise after two weeks. Check with Dr. Patel at your follow-up.', now() - interval '9 minutes'),
  ('00000000-0000-0000-0000-0000000000c4', 'patient', '00000000-0000-0000-0000-000000000061', 'I ran out of my prescription.', now() - interval '5 minutes'),
  ('00000000-0000-0000-0000-0000000000c4', 'bot',     null, 'I have forwarded this to your doctor for a refill.', now() - interval '4 minutes');

-- routed_to, patient_id and hospital_id are filled in by the escalations_fill trigger.
insert into public.escalations (id, conversation_id, reason, urgency) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c2', 'Possible wound infection: redness, swelling, fever.', 'high'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000c4', 'Prescription refill request.', 'low');

-- Care-team notes the chatbot answers from. author_id is normally filled from the signed-in
-- user, so it's set by hand here.
insert into public.bot_knowledge (id, patient_id, author_id, title, content) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000021',
   'Wound care', 'Alex had knee arthroscopy on 2026-10-14. Keep the dressing dry for 48 hours after surgery. After that Alex can shower; pat the incisions dry. No baths, pools or hot tubs until the stitches are out.'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000031',
   'Pain medication', 'Ibuprofen 400 mg every 6 hours with food, as needed for pain, for up to 7 days. No more than 4 doses in 24 hours.'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000021',
   'Follow-up', 'Stitch removal and follow-up with Dr. Kim on 2026-10-24 at 10:30, Orthopedics clinic, 2nd floor. Bring the knee brace.'),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000021',
   'Follow-up', 'Wound check with Dr. Kim on 2026-10-20 at 09:00, General Surgery clinic.');

-- One audit row, so staff-side screens have something to show.
insert into public.bot_decisions (conversation_id, message_id, action, reason)
select conversation_id, id, 'small_talk', 'Greeting or thanks, no question.'
from public.messages
where conversation_id = '00000000-0000-0000-0000-0000000000c1' and content = 'Thanks, that helps.';

drop table demo_users;
