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
- [ ] Patient-only migration: replace hospital model with `patients`, `doctors`, `care_notes`, `messages`, `doctor_messages`, `entry_links` + RLS + tests (2026-10-17, Andrew)
- [ ] Guest mode: enable Supabase anonymous sign-in; guest → email account upgrade keeps data (2026-10-17, Andrew)
- [ ] `chat` edge function: Claude answers from the current care notes, flags when to notify the doctor (2026-10-17, Andrew)
- [ ] `notify-doctor` + `view-doctor-message`: email a link-only notice, token-checked page data (2026-10-17, Andrew)
- [ ] `entry-link` + `doctor-entry`: optional QR flow for the doctor's own phone (2026-10-17, Andrew)
- [ ] Pick email provider (Resend?) and sending address (2026-10-17, Andrew)

## Ideas

Future features and nice-to-haves, either side.

_Nothing yet._
