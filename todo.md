# To-do

Shared list for both sides.

- Edit only your own side's section. Need something from the other side? Ask in `overlap.md`.
- Anyone can add to **Ideas**. When a side picks an idea up, it moves it into its own section.
- Format: `- [ ] task (YYYY-MM-DD, Name)`. Tick it `[x]` when done.

## Frontend

- [x] Build and verify care-space/conversation frontend pair in fictional demo (2026-10-17, Gold M for Ranveer).
- [x] Build and verify clinician-builder/checklist frontend pair with provenance and approval (2026-10-17, Gold M for Ranveer).
- [x] Build and verify approved family-access/consented-handoff frontend pair locally (2026-10-17, Gold M for Ranveer).
- [ ] Confirm Marcus file ownership and active repository sessions for continued parallel work (2026-10-17, Gold M for Ranveer).
- [ ] Bind typed frontend adapter to Andrew's agreed Supabase auth/data/storage/AI/realtime contracts (2026-10-17, Gold M for Ranveer).
- [ ] Publish current frontend through PR as explicitly requested, address Claude/conflict review; no merge without authorization (2026-10-17, Gold M for Ranveer).
- [ ] Verify full integrated GitHub revision with separate authenticated roles and direct server policy checks (2026-10-17, Gold M for Ranveer).

## Backend

- [x] Pick stack (Supabase) and set up `backend/` (2026-10-17, Andrew)
- [x] Hospital access model: roles, care teams, conversations, escalations, RLS + tests (2026-10-17, Andrew)
- [x] `admin-create-user` and `escalate` edge functions (2026-10-17, Andrew)
- [ ] ~~Chatbot edge function with hospital escalation~~ replaced by `chat` below (patient-only pivot, see `PLAN.md`) (2026-10-17, Andrew)
- [ ] ~~Escalation inbox query~~ dropped: no doctor accounts after the pivot (2026-10-17, Andrew)
- [ ] ~~Try `admin-create-user` and `escalate` with real demo logins~~ dropped: both functions go away (2026-10-17, Andrew)
- [ ] Turn on leaked-password protection in Supabase Auth settings (2026-10-17, Andrew)
- [x] Patient-only migration: replace hospital model with `patients`, `doctors`, `care_notes`, `messages`, `doctor_messages`, `entry_links` + RLS + tests (2026-10-17, Andrew)
- [x] Guest mode: enable Supabase anonymous sign-in; guest → email account upgrade keeps data (2026-10-17, Andrew)
- [x] Allow anonymous sign-ins on the hosted project (2026-10-17, Andrew)
- [x] `chat` edge function: rewrite for the new tables and redeploy. Claude answers from the current care notes, flags when to notify the doctor, rate-limited (2026-10-17, Andrew)
- [x] Close PR #4 (chatbot on the hospital model) as superseded (2026-10-17, Andrew)
- [x] Review fixes from #5/#6: default privileges, stable note versions, doctor-message abuse limits (2026-10-17, Andrew)
- [x] Set the `ANTHROPIC_API_KEY` secret on hosted (2026-10-17, Andrew)
- [x] Run the bot's live eval once the key is set: 15/15, 0 unsafe (2026-10-17, Andrew)
- [x] `chat` refers less: clear implications, "is this normal?" from a `normal` list, `warning_sign` action (2026-10-17, Andrew)
- [x] Pick email provider: Resend's test sender `onboarding@resend.dev`, no domain needed for the demo (2026-10-17, Andrew)
- [ ] Sign up for Resend with the demo doctor's inbox; set `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` secrets (2026-10-17, Andrew)
- [ ] Agree doctor-page routes (`/doctor-message`, `/doctor-entry`, token in the URL hash) with frontend in `overlap.md` (2026-10-17, Andrew)
- [x] `notify-doctor`: token + `doctor_messages` row, map the trigger's limit hints to 4xx, email `recipient_email` a link-only notice (2026-10-17, Andrew)
- [x] `view-doctor-message`: token check, set `opened_at`, return message + first name + current notes; per-IP rate limit (2026-10-17, Andrew)
- [ ] After merge: deploy `notify-doctor` and `view-doctor-message` (`--no-verify-jwt`), send one real email end to end (2026-10-17, Andrew)
- [ ] Delete the doctor-message live-test leftovers on hosted (SQL in `backend_progress.md` → Known issues) (2026-10-17, Andrew)
- [ ] Move to a verified sending domain so any doctor's address works, not just the Resend account's (2026-10-17, Andrew)
- [ ] `entry-link` + `doctor-entry`: QR token (30 min, one use), pre-filled current notes, save as `entered_via = 'qr'` (2026-10-17, Andrew)
- [ ] Turn on captcha for anonymous sign-ins if guest abuse shows up (2026-10-17, Andrew)

## Ideas

Future features and nice-to-haves, either side.

- Doctor replies from the message page, shown in the patient's chat (2026-10-17, Andrew)
- Doctor sets a PIN at the visit; message links also ask for it, so a forwarded email alone can't be read. Parked by the team for now (2026-10-17, Andrew)
- Show the patient what changed between care-note versions ("Dr. Okafor raised your dose on Oct 14") (2026-10-17, Andrew)
- Daily reminder push/SMS for medications from the notes (2026-10-17, Andrew)
- Chat in the patient's language (notes stay in English, bot answers in theirs) (2026-10-17, Andrew)
