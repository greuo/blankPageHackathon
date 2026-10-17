-- Demo data for the patient-only model. Fixed UUIDs so tests and the frontend can refer to them.
-- All people, clinics, emails and phone numbers are fictional.
--
-- Password for Alex: 'local-demo-only' for a local `supabase db reset`.
-- On the hosted project the real demo password lives in backend/.env.local (ask Andrew);
-- seed there with `set seed.demo_password_hash = '<bcrypt hash>';` before running this file.
-- Rerunning this file resets both demo patients (it deletes them first).
--
-- Patients (the auth.users insert trigger creates their `patients` rows)
--   ...0101  Alex Rivera  email account alex@demo.example.com
--   ...0102  Sam          guest (anonymous sign-in, no email or password). A guest only lives on the
--                         device that created it, so nobody can sign in as Sam; it's here for tests.
-- Doctors (contact details only; doctors have no accounts)
--   ...0201  Dr. Maya Okafor, Harbor Family Clinic   (Alex's)
--   ...0202  Dr. Leo Martins, Bayside Urgent Care    (Sam's)
-- Care notes (version is set by the care_notes_number trigger)
--   ...0301  Alex v1  high blood pressure, lisinopril 10 mg  (entered on Alex's phone)
--   ...0302  Alex v2  dose raised to 20 mg + blood test       (entered by QR link)  <- current
--   ...0303  Sam  v1  stitches in left palm                   (entered on Sam's phone) <- current
-- Plus a short chat for each, one doctor message from Alex to Dr. Okafor, and one used QR link for Sam.
-- Token hashes are hashes of random bytes, so no usable link token is in this file.

-- Old hospital-model demo accounts (no-op on a fresh database), then this file's own patients so it
-- can be rerun. Deleting an auth user cascades to auth.identities and to all of that patient's rows.
delete from auth.users where id in (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000041',
  '00000000-0000-0000-0000-000000000042',
  '00000000-0000-0000-0000-000000000043',
  '00000000-0000-0000-0000-000000000051',
  '00000000-0000-0000-0000-000000000061',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);

-- ---------------------------------------------------------------------------
-- Auth users
-- ---------------------------------------------------------------------------

-- Alex: email + password account.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000101',
  'authenticated', 'authenticated', 'alex@demo.example.com',
  coalesce(
    nullif(current_setting('seed.demo_password_hash', true), ''),
    extensions.crypt('local-demo-only', extensions.gen_salt('bf'))
  ),
  now(),
  '{"provider":"email","providers":["email"]}', '{"display_name":"Alex Rivera"}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000101', 'email',
  '{"sub":"00000000-0000-0000-0000-000000000101","email":"alex@demo.example.com","email_verified":true,"phone_verified":false}',
  now(), now(), now()
);

-- Sam: guest, the way anonymous sign-in stores it (no email, empty password, no identity row).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, is_anonymous,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000102',
  'authenticated', 'authenticated', null, '', true,
  '{"provider":"anonymous","providers":["anonymous"]}', '{"display_name":"Sam"}', now(), now(),
  '', '', '', ''
);

-- ---------------------------------------------------------------------------
-- Doctors
-- ---------------------------------------------------------------------------

insert into public.doctors (id, patient_id, name, email, clinic, clinic_phone) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101',
   'Dr. Maya Okafor', 'maya.okafor@example.com', 'Harbor Family Clinic', '555-0142'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102',
   'Dr. Leo Martins', 'leo.martins@example.com', 'Bayside Urgent Care', '555-0187');

-- ---------------------------------------------------------------------------
-- Care notes. One insert per version so they number in order.
-- ---------------------------------------------------------------------------

-- Alex v1: first visit.
insert into public.care_notes (id, patient_id, doctor_id, entered_via, content) values (
  '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000201', 'patient_phone',
  $json${
    "reason": "High blood pressure (hypertension). Your readings today were 152/96 and 148/94. Over time this raises the risk of heart attack and stroke, so we are starting a daily medicine.",
    "medications": [
      {"name": "Lisinopril", "dose": "10 mg (1 tablet)", "when": "Once a day, in the morning", "until": "Ongoing. Don't stop unless Dr. Okafor tells you to."}
    ],
    "instructions": [
      "Check your blood pressure at home every morning before your tablet, and write it down.",
      "Cut back on salt: less than 2,000 mg of sodium a day. Go easy on canned soup, deli meat and fast food.",
      "Walk for 30 minutes on most days.",
      "No more than 1 alcoholic drink a day.",
      "For pain, use acetaminophen (Tylenol). Avoid ibuprofen and naproxen; they can raise blood pressure."
    ],
    "warning_signs": [
      {"sign": "Swelling of the lips, tongue, face or throat, or trouble breathing", "action": "Stop lisinopril and call 911."},
      {"sign": "Severe headache with confusion, chest pain, or trouble seeing or speaking", "action": "Call 911."},
      {"sign": "Home reading above 180/110", "action": "Rest 5 minutes and check again. If it's still that high, call the clinic now; after hours, go to urgent care."},
      {"sign": "Dizziness or light-headedness when you stand up", "action": "Sit or lie down until it passes and stand up slowly. Call the clinic if it keeps happening."},
      {"sign": "A dry cough that won't go away", "action": "Not urgent. Send Dr. Okafor a message; she may switch your medicine."}
    ],
    "contact_rules": "Call Harbor Family Clinic at 555-0142 (Monday to Friday, 8am to 5pm) about side effects or home readings above 160/100. Use Send to my doctor for questions that can wait a day or two. For emergencies, call 911.",
    "follow_up": "2026-10-14 at Harbor Family Clinic. Bring your blood pressure log."
  }$json$
);

-- Alex v2: follow-up visit, Dr. Okafor typed it on her own phone through a QR link.
insert into public.care_notes (id, patient_id, doctor_id, entered_via, content) values (
  '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000201', 'qr',
  $json${
    "reason": "High blood pressure (hypertension). Your home readings on 10 mg averaged 142/90, still above the goal of under 130/80, so we are raising the dose.",
    "normal": [
      "Feeling a little more tired than usual for the first week on the higher dose.",
      "A mild headache in the first few days, if it eases with acetaminophen (Tylenol)."
    ],
    "medications": [
      {"name": "Lisinopril", "dose": "20 mg (1 tablet)", "when": "Once a day, in the morning", "until": "Ongoing. Don't stop unless Dr. Okafor tells you to."}
    ],
    "instructions": [
      "Until your old 10 mg tablets run out, take 2 of them together each morning. Then switch to the new 20 mg tablets, 1 a day.",
      "Get a blood test (kidney function and potassium) at the clinic lab within 1 to 2 weeks. No need to fast.",
      "Keep checking your blood pressure every morning before your tablet, and write it down.",
      "Cut back on salt: less than 2,000 mg of sodium a day.",
      "Walk for 30 minutes on most days.",
      "For pain, use acetaminophen (Tylenol). Avoid ibuprofen and naproxen; they can raise blood pressure."
    ],
    "warning_signs": [
      {"sign": "Swelling of the lips, tongue, face or throat, or trouble breathing", "action": "Stop lisinopril and call 911."},
      {"sign": "Severe headache with confusion, chest pain, or trouble seeing or speaking", "action": "Call 911."},
      {"sign": "Home reading above 180/110", "action": "Rest 5 minutes and check again. If it's still that high, call the clinic now; after hours, go to urgent care."},
      {"sign": "Dizziness or light-headedness when you stand up", "action": "Sit or lie down until it passes and stand up slowly. Call the clinic if it keeps happening."},
      {"sign": "Home readings below 100/60, or feeling faint", "action": "Call the clinic the same day; the dose may be too high."},
      {"sign": "A dry cough that won't go away", "action": "Not urgent. Send Dr. Okafor a message; she may switch your medicine."}
    ],
    "contact_rules": "Call Harbor Family Clinic at 555-0142 (Monday to Friday, 8am to 5pm) about side effects or home readings above 160/100. Use Send to my doctor for questions that can wait a day or two. For emergencies, call 911.",
    "follow_up": "2026-11-11 at Harbor Family Clinic. Bring your blood pressure log; we'll go over the blood test results."
  }$json$
);

-- Sam v1: urgent care visit.
insert into public.care_notes (id, patient_id, doctor_id, entered_via, content) values (
  '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000202', 'patient_phone',
  $json${
    "reason": "A 3 cm cut on the palm of your left hand from a kitchen knife. It was cleaned and closed with 5 stitches. The tendons and nerves are fine. You also had a tetanus booster today.",
    "normal": [
      "Some soreness, mild swelling and slight pinkness right along the stitches for the first 2 to 3 days.",
      "A little clear or slightly pink fluid on the bandage on the first day.",
      "Itching around the stitches as the cut heals."
    ],
    "medications": [
      {"name": "Ibuprofen", "dose": "400 mg (2 tablets of 200 mg)", "when": "Every 6 to 8 hours with food, only if you need it for pain", "until": "Up to 5 days"},
      {"name": "Acetaminophen (Tylenol)", "dose": "500 mg (1 tablet)", "when": "Every 6 hours if you need more pain relief. No more than 6 tablets (3,000 mg) a day.", "until": "Up to 5 days"}
    ],
    "instructions": [
      "Keep the bandage on and the cut dry for the first 24 hours.",
      "After 24 hours you can shower and let water run over the stitches, then pat dry. Don't soak your hand in a bath, pool or dishwater until the stitches are out.",
      "Once a day, put a thin layer of petroleum jelly on the stitches and cover them with a clean bandage.",
      "For the first 2 days, keep your hand raised above your heart when you can, to keep swelling down.",
      "No heavy lifting or hard gripping with your left hand until the stitches are out."
    ],
    "warning_signs": [
      {"sign": "Redness spreading out from the cut, warmth, pus, or a bad smell", "action": "Come back to Bayside Urgent Care today, or call 555-0187."},
      {"sign": "Fever of 100.4 F (38 C) or higher", "action": "Call Bayside Urgent Care at 555-0187 today."},
      {"sign": "Numbness or tingling in your fingers, or you can't bend a finger", "action": "Come back to urgent care right away."},
      {"sign": "Bleeding that doesn't stop after 10 minutes of firm pressure", "action": "Call 911 or go to the nearest emergency room."},
      {"sign": "A stitch comes out or the cut opens up", "action": "Cover it with a clean bandage and call 555-0187."}
    ],
    "contact_rules": "Bayside Urgent Care is open every day, 8am to 8pm: call 555-0187 or walk in. Use Send to my doctor for questions that aren't urgent. For heavy bleeding or anything that feels like an emergency, call 911.",
    "follow_up": "Stitches come out in 10 days, on 2026-10-26. Walk in to Bayside Urgent Care or see your regular doctor."
  }$json$
);

-- The trigger stamps every save with now(); backdate the demo notes to their visit dates.
update public.care_notes set created_at = '2026-09-30 15:20:00-07' where id = '00000000-0000-0000-0000-000000000301';
update public.care_notes set created_at = '2026-10-14 10:05:00-07' where id = '00000000-0000-0000-0000-000000000302';
update public.care_notes set created_at = '2026-10-16 09:40:00-07' where id = '00000000-0000-0000-0000-000000000303';

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

insert into public.messages (patient_id, sender, content, created_at) values
  ('00000000-0000-0000-0000-000000000101', 'patient',
   'I sometimes feel dizzy when I stand up since the dose went up. Is that normal?',
   now() - interval '2 days 3 hours'),
  ('00000000-0000-0000-0000-000000000101', 'bot',
   'Dr. Okafor''s notes list dizziness when you stand up as something to watch for. Sit or lie down until it passes and stand up slowly. If it keeps happening, call Harbor Family Clinic at 555-0142. If you faint, call 911.',
   now() - interval '2 days 3 hours' + interval '6 seconds'),
  ('00000000-0000-0000-0000-000000000101', 'patient',
   'Can I take my lisinopril at night instead? Mornings are hard with my work schedule.',
   now() - interval '1 day 2 hours'),
  ('00000000-0000-0000-0000-000000000101', 'bot',
   'Your notes say to take lisinopril 20 mg once a day, in the morning. They don''t say whether the evening is OK, so check with Dr. Okafor before you change the time. Want me to send her your question?',
   now() - interval '1 day 2 hours' + interval '5 seconds'),
  ('00000000-0000-0000-0000-000000000101', 'patient',
   'Yes please.',
   now() - interval '1 day 1 hour 58 minutes'),
  ('00000000-0000-0000-0000-000000000101', 'bot',
   'Sent. Dr. Okafor will get an email with a secure link to your question. Until she answers, keep taking it in the morning.',
   now() - interval '1 day 1 hour 58 minutes' + interval '4 seconds'),

  ('00000000-0000-0000-0000-000000000102', 'patient',
   'Can I shower with the stitches?',
   now() - interval '20 hours'),
  ('00000000-0000-0000-0000-000000000102', 'bot',
   'Yes, once the first 24 hours are up. Dr. Martins'' notes say you can let water run over the stitches, then pat them dry. Don''t soak your hand in a bath, pool or dishwater until the stitches are out.',
   now() - interval '20 hours' + interval '5 seconds'),
  ('00000000-0000-0000-0000-000000000102', 'patient',
   'When do the stitches come out?',
   now() - interval '3 hours'),
  ('00000000-0000-0000-0000-000000000102', 'bot',
   'In 10 days, on 2026-10-26. You can walk in to Bayside Urgent Care or see your regular doctor.',
   now() - interval '3 hours' + interval '4 seconds');

-- ---------------------------------------------------------------------------
-- "Send to my doctor" and QR links (normally written by edge functions)
-- ---------------------------------------------------------------------------

insert into public.doctor_messages (patient_id, doctor_id, content, token_hash, created_at, expires_at) values (
  '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201',
  'Can I take my lisinopril at night instead of in the morning? Mornings are hard with my work schedule.',
  encode(extensions.digest(extensions.gen_random_bytes(32), 'sha256'), 'hex'),
  now() - interval '1 day 1 hour 58 minutes',
  now() - interval '1 day 1 hour 58 minutes' + interval '7 days'
);

-- Already used, so it can't be opened again.
insert into public.entry_links (patient_id, token_hash, created_at, expires_at, used_at) values (
  '00000000-0000-0000-0000-000000000102',
  encode(extensions.digest(extensions.gen_random_bytes(32), 'sha256'), 'hex'),
  now() - interval '1 day',
  now() - interval '1 day' + interval '30 minutes',
  now() - interval '1 day' + interval '6 minutes'
);
