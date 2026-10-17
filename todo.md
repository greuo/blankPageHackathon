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
- [ ] Chatbot edge function: reply to patient messages with Claude, escalate when a human is needed (2026-10-17, Andrew)
- [ ] Escalation inbox query: open first, own patients (`routed_to = me`) on top (2026-10-17, Andrew)
- [ ] Try `admin-create-user` and `escalate` with real demo logins (2026-10-17, Andrew)
- [ ] Turn on leaked-password protection in Supabase Auth settings (2026-10-17, Andrew)

## Ideas

Future features and nice-to-haves, either side.

_Nothing yet._
