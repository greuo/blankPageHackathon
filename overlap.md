# Overlap: frontend ↔ backend

Things one side needs the other to see: API changes, requests, questions, heads-ups.

- Write new notes in the section for your direction, newest at the top.
- Format: `- [ ] YYYY-MM-DD · Name: note`
- The receiving side ticks `[x]` once it's handled and can add an indented reply: `  - ↳ YYYY-MM-DD · Name: reply`. Ticking and replying are the only edits you make to the other side's notes.

## Agreed

Things both sides rely on: API base URL, ports, data shapes, auth, env vars. Either side can add one. To change one, post a note in your direction's section first and wait for a reply.

- **Product:** patient-only app as written in `PLAN.md`. No doctor/nurse/admin accounts; doctors use Doctor mode on the patient's phone (or the optional QR form) and get link-only emails. Agreed by the whole team 2026-10-17.
- **Backend:** Supabase. Frontend talks to it with `@supabase/supabase-js` v2; no custom REST server.
- **`SUPABASE_URL`:** `https://repvtuxyszlqdjzciojx.supabase.co`
- **`SUPABASE_ANON_KEY`:** `sb_publishable_igEs9JeKLT-n8_SAYRjkwg_wAMphe15` (publishable key, safe in the browser; RLS does the access control)
- **Auth:** patients only. Guest = Supabase anonymous sign-in; signed in = email + password, self sign-up. A guest can upgrade to an account and keep their data.
- **Roles:** none. Every signed-in user (guest or not) is a patient and sees only their own rows.
- **Data shapes:** the patient-only tables are live (2026-10-17); "Data model", "Edge functions" and the supabase-js cheat sheet in `backend_progress.md` are the source of truth. `PLAN.md` has the overview. Edge function contracts get added there as each one lands.
- **Demo logins:** `alex@demo.example.com` (patient with a doctor, two care-note versions, chat and a sent doctor message; password: ask Andrew). Guest: `supabase.auth.signInAnonymously()` gives a fresh, empty patient (on hosted too, since 2026-10-17). The old hospital logins are deleted.

## Backend → Frontend

- [ ] 2026-10-17 · Andrew: **`chat` is live for the patient-only tables, and guest sign-in is on hosted.**
  - Call `supabase.functions.invoke('chat', { body: { content } })` instead of inserting into `messages` yourself. It saves the patient message and the bot reply (both also arrive by realtime). Response: `{ patient_message, reply, action, suggest_notify_doctor }`, `action` is `answered` | `small_talk` | `referred` | `emergency`. When `suggest_notify_doctor` is true, offer "Send to my doctor". 429 means too many messages (20 per 10 minutes).
  - Care notes: saving your free-text instructions as `{ "instructions": "…" }` works today; the bot reads it line by line. See `PLAN.md` → Care-notes content shape.
  - "Send to my doctor" will need an email account: guests get asked to add an email first (anti-spam, `PLAN.md` → Doctor emails: abuse limits).
  - `supabase.auth.signInAnonymously()` now works on hosted.

- [ ] 2026-10-17 · Andrew: **Patient-only tables are live on hosted; bind to these.** Full columns, rules and supabase-js snippets: `backend_progress.md` → Data model / cheat sheet.
  - `patients` (`id` = auth user, `display_name`): created on sign-up; you can update `display_name`.
  - `doctors` (`name`, `email`, `clinic`, `clinic_phone`): read / insert / update / delete.
  - `care_notes` (`doctor_id`, `version`, `content` JSON, `entered_via`, `created_at`): each insert is a new version (server sets `version`); no update; delete allowed. Read the latest from the `current_care_notes` view.
  - `messages` (`sender` `patient`|`bot`, `content`): read + insert your own (`sender` defaults to `patient`). Bot replies come from `chat`, which is being rewritten (the deployed one is broken).
  - `doctor_messages`, `entry_links`: read-only; edge functions write them.
  - RLS: every signed-in user, guest or email, sees only their own rows; signed out sees nothing. `patient_id` defaults to the caller, so leave it out of inserts.
  - Guest: `supabase.auth.signInAnonymously()`; upgrade with `updateUser({ email })`, then `updateUser({ password })` once confirmed; same user id, data kept. On hosted this needs a dashboard toggle (Andrew); until then use email sign-up.
  - Realtime on `messages` and `care_notes`.
  - Old hospital demo logins are gone; demo patient is `alex@demo.example.com` (see Agreed).
- [ ] 2026-10-17 · Andrew: **Pivot agreed by the whole team (2026-10-17), now under Agreed:** patients-only app, written up in `PLAN.md` at the repo root. No doctor/nurse/admin accounts or hospitals. Doctor enters notes in a Doctor mode on the patient's phone (optional: scan a QR and type on their own phone). Chatbot answers from those notes. Patient can use it as a guest or signed in. "Send to my doctor" emails the doctor a secure link to the message stored in Supabase. Your clinician builder maps onto Doctor mode; family access is your call. This replaces the hospital model above, so hold off binding to the current tables.
  - ↳ 2026-10-17 · Andrew: The new patient-only tables are live (note above), so no need to hold off any more.
- [ ] 2026-10-17 · Andrew: Backend is live on Supabase; see **Agreed** above for URL, key, roles and demo logins. Access model: a hospital has admin / doctor / nurse / patient accounts. Patients chat with the bot; their care team (assigned doctors + nurses) can read and reply. When a chat is forwarded (`escalations`), it's routed to the treating doctor but every doctor in the hospital sees it. Admins manage accounts and care teams but can't read chats. Full table in `backend_progress.md`.
  - ↳ 2026-10-17 · Andrew: Superseded: the hospital model and its tables are gone; see the patient-only note at the top.
- [ ] 2026-10-17 · Andrew: Question: which screens are you building first (patient chat, doctor escalation inbox, admin user management)? We'll prioritise the chatbot or any missing queries around that.

## Frontend → Backend

- [ ] 2026-10-17 · Gold M / Codex for Ranveer: Read backend PR #2 and preserved its changes while preparing our frontend PR. Ranveer requested publication now and deferred backend connection. Frontend has patient/doctor/family care spaces, source-based companion, clinician plan builder, daily checklist and consented handoff; no admin/nurse screens yet. Family grants, private-chat membership and consented handoffs are prototype contracts that need reconciliation with hospital roles and hospital-wide escalations before live integration.
  - ↳ 2026-10-17 · Andrew: Proposing to drop hospital roles and escalations entirely; see `PLAN.md` and the pivot note under Backend → Frontend.

- [ ] 2026-10-17 · Gold M / Codex for Ranveer: frontend owns proposed `frontend/` tree, internal view model in `frontend/src/data/types.ts`, fictional adapter in `repository.ts`; no production table/API names assumed. Please confirm branch and contracts before live binding. Contact thread: https://blankpagehackathon.slack.com/archives/C0C9ZF57F9U/p1792247444562409 .
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: need Supabase public config, authenticated test identities, schema/RPC/Edge Function/error contracts, source/approval/checklist occurrence states, private document policy, scoped realtime/revocation behavior. No service-role/secret keys in frontend. See `frontend/docs/INTEGRATION.md`.
  - ↳ 2026-10-17 · Andrew: Public config is under Agreed; tables, RLS and supabase-js snippets are in `backend_progress.md`; test identity `alex@demo.example.com` or a guest (see Agreed). No service-role key needed in the frontend. Edge function contracts follow as each one lands.
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: Ranveer approved Basic = nonclinical updates + explicitly joined chats; Support adds approved checklist/questions/observations/attributed family reports; Full adds shared plans/documents. All private chats require participation, including for doctor/admin; family cannot edit orders/manage grants. Doctor/patient equally manage grants with audit. New spaces do not auto-grant family access.
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: 28 unit tests and 18 browser flow groups pass locally; backend isolation, realtime and live AI/delivery not verified. All 71 ECC definitions inventoried, relevant bounded tasks used. Please identify every active repository Claude/Codex session and ownership so exact file/commit clearance reaches each one; silence will not authorize a push.
