# Backend progress

Owned by the backend side (Andrew, Sharon). Only backend sessions edit this file. Frontend: read it, but put anything for us in `overlap.md`.

## Current state

Snapshot of what exists right now. Rewrite it each session; don't append.

- **Stack:** Supabase (Postgres + Supabase Auth + Row Level Security + Edge Functions). Hosted project `blankPageHackathon` (ref `repvtuxyszlqdjzciojx`, us-east-1). Code in `backend/supabase/`.
- **How to run:** nothing to run for the frontend: use the hosted project (URL and key in `overlap.md` → Agreed). Local stack: `cd backend && supabase start && supabase db reset` (needs Docker; seeds demo data with password `local-demo-only`). Schema changes: add a file under `backend/supabase/migrations/`, apply it, rerun `backend/supabase/tests/access.sql`.
- **Working:**
  - Access model: hospitals → admin / doctor / nurse / patient accounts, care teams, chatbot conversations + messages, escalations ("forwarded to the hospital"). All enforced with RLS; 49/49 checks in `tests/access.sql` pass on the hosted project.
  - Edge functions `admin-create-user` and `escalate` deployed; both reject unauthenticated calls.
  - Demo data seeded on the hosted project (2 hospitals, 9 users). The demo password is in Andrew's `backend/.env.local` (not committed); ask him.
  - Realtime on `messages` and `escalations`.
- **In progress:** patient-only pivot (agreed 2026-10-17, see `PLAN.md`). Next up is the migration that replaces the hospital model below; until it lands, everything below describes the old model.
- **Known issues:**
  - The chatbot itself doesn't exist yet: bot messages in the seed are hard-coded.
  - Edge function role checks (admin vs doctor, owner vs other patient) are written but not yet exercised with real logins.
  - Supabase advisor: leaked-password protection is off (dashboard setting).

### Who can see what

| | Patient | Nurse | Doctor | Admin |
| --- | --- | --- | --- | --- |
| Profiles | self + own care team + any staff who replied to them or claimed their escalation | own hospital's staff + assigned patients | own hospital's staff + assigned/escalated patients | whole hospital |
| Patients | self | assigned | assigned + any with an escalation | whole hospital |
| Conversations / messages | own: read + send | assigned: read + reply | assigned or escalated: read + reply | none |
| Escalations | none | assigned patients': read | whole hospital: read, claim, resolve | none |
| Care assignments | own | own | own | whole hospital: add / remove / toggle |

"Assigned" = active row in `care_assignments`. Escalations route to the patient's `primary_doctor_id` (the treating doctor) via `routed_to`, but every doctor in the hospital sees them. Nobody ever sees another hospital's data.

### API

What the frontend can call. Use `supabase-js` with the anon key; RLS filters every query to what the signed-in user may see, so no extra `where` is needed for permissions.

| Method | Path | Request | Response | Status |
| ------ | ---- | ------- | -------- | ------ |
| supabase-js | `auth.signInWithPassword` | `{ email, password }` | session | done |
| GET | `from('profiles').select()` | – | `{ id, hospital_id, role, full_name, email }[]`; own role = row where `id = user.id` | done |
| GET | `from('patients').select('*, profile:profiles!patients_id_fkey(full_name)')` | – | `{ id, hospital_id, date_of_birth, mrn, primary_doctor_id }[]` | done |
| GET | `from('conversations').select()` | – | `{ id, patient_id, hospital_id, created_at }[]` | done |
| POST | `from('conversations').insert({ patient_id })` | patient only, own id | conversation | done |
| GET | `from('messages').select().eq('conversation_id', id).order('created_at')` | – | `{ id, conversation_id, sender_type: patient\|bot\|staff, sender_id, content, created_at }[]` | done |
| POST | `from('messages').insert(...)` | patient: `{ conversation_id, sender_type: 'patient', sender_id: me, content }`; doctor/nurse: same with `'staff'` | message | done |
| GET | `from('escalations').select().order('created_at', { ascending: false })` | – | `{ id, conversation_id, patient_id, hospital_id, reason, urgency, status, routed_to, claimed_by, created_at, claimed_at, resolved_at }[]` | done |
| PATCH | `from('escalations').update({ status }).eq('id', id)` | doctors only; `open`/`claimed`/`resolved` (claimed_by and timestamps fill in automatically) | escalation | done |
| GET/POST/PATCH/DELETE | `from('care_assignments')` | admin: `{ patient_id, staff_id, active }` | rows | done |
| POST | `functions/v1/admin-create-user` | admin; `{ email, password, full_name, role, date_of_birth?, mrn?, primary_doctor_id?, care_team?: uuid[] }` | `{ id, email, role, full_name, hospital_id }` 201 | done |
| POST | `functions/v1/escalate` | patient; `{ conversation_id, reason, urgency?: low\|medium\|high }` | escalation 201 (+ a bot message in the chat) | done |
| realtime | `channel().on('postgres_changes', { table: 'messages' \| 'escalations' })` | – | inserts/updates the user can see | done |

## Session log

Newest first. One entry per session:

```md
### YYYY-MM-DD · Name
- **Did:** what changed
- **Files:** main files/areas touched
- **Next:** what should happen next
- **Notes:** blockers, decisions, gotchas (optional)
```

### 2026-10-17 · Andrew (pivot)
- **Did:** Wrote `PLAN.md`: patient-only app, Doctor mode on the patient's phone (optional QR form), guest or signed-in patients, link-only doctor emails backed by Supabase. Whole team agreed. Updated `overlap.md` Agreed (auth, roles, data shapes) and the backend to-dos.
- **Files:** `PLAN.md`, `overlap.md`, `todo.md`, this file
- **Next:** patient-only migration + RLS tests, anonymous sign-in, then the `chat` edge function.
- **Notes:** We trust the patient: doctor notes aren't locked against edits. The old hospital tables and the `admin-create-user` / `escalate` functions go away with the migration.

### 2026-10-17 · Andrew
- **Did:** Picked Supabase. Built the hospital access model (schema, RLS, triggers), seeded demo data, deployed `admin-create-user` and `escalate` edge functions, wrote and ran RLS tests. Fixed two PR review findings in a second migration: patients can see the profile of a non-care-team doctor who replied after an escalation, and reopening an escalation clears `resolved_at` (49/49 pass).
- **Files:** `backend/supabase/migrations/20261017144002_access_model.sql`, `20261017145639_review_fixes.sql`, `backend/supabase/seed.sql`, `backend/supabase/tests/access.sql`, `backend/supabase/functions/`
- **Next:** the chatbot edge function (Claude; `escalate` only accepts a signed-in patient today, so share its insert logic in a helper the chatbot can import); escalation inbox sorted own-patients-first; try the edge functions with real demo logins.
- **Notes:** Admins can't read chats or escalations, on purpose (privacy). Opening an escalation gives every doctor in the hospital read + reply on that one conversation. Migrations are applied through the Supabase MCP, so the version in the filename matches the hosted project's migration history.
