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
- **Chatbot:** live on hosted. Migration `20261017152104_chatbot.sql` is applied, demo notes are seeded, and `chat` is deployed along with the updated `escalate`. **The `ANTHROPIC_API_KEY` secret is still needed** (dashboard → Edge Functions → Secrets). Until it's set, every non-red-flag message escalates, which is safe but not useful.
  - The care team (assigned doctors + nurses) writes per-patient notes in `bot_knowledge`. The bot answers **only** from those notes.
  - `functions/v1/chat`: saves the patient's message, then either answers or escalates. Escalation happens on a red-flag keyword (911 notice, high urgency), when the model is unsure, when the message touches symptoms or a treatment change, when the answer has no or invalid note citations, or when the model errors or refuses. Model: `claude-opus-5-5`. While an escalation is open or claimed, the bot stays quiet.
  - Every bot turn is logged in `bot_decisions` (staff only).
  - Each escalation creates one `alerts` row per responsible doctor: the routed-to doctor plus care-team doctors, or every doctor in the hospital if there are none. Resolving the escalation clears its alerts. Realtime is on.
  - Tests: 85/85 checks in `tests/access.sql` pass on the hosted project (and on local Postgres), and 6/6 in `chat/safety_test.ts`. The bot hasn't been run against Claude yet (`chat/eval_live.ts` does that).
- **In progress:** nothing
- **Known issues:**
  - The seed's hard-coded bot messages predate the chatbot.
  - Supabase advisor flags `conversation_handed_off` (SECURITY DEFINER, callable by signed-in users). That's intended: it returns false for conversations the caller can't read.
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
| Bot notes (`bot_knowledge`) | none | assigned: read + write | assigned: read + write; escalated: read | none |
| Bot decisions | none | assigned: read | assigned or escalated: read | none |
| Alerts | none | none | own: read + mark read | none |

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
| POST | `functions/v1/chat` | patient; `{ conversation_id, content }` (1-4000 chars). Use this instead of inserting patient messages directly, or the bot won't reply | `{ patient_message, reply: message\|null, action: answered\|small_talk\|escalated\|held, handed_off: bool }` 201; both messages also arrive by realtime | done |
| RPC | `rpc('conversation_handed_off', { p_conversation })` | patient or staff who can read the chat | `true` while a person has it (open/claimed escalation), so the patient UI can show "with your care team" | done |
| GET | `from('bot_knowledge').select().eq('patient_id', id).order('updated_at', { ascending: false })` | care team (+ escalated doctors, read only) | `{ id, patient_id, hospital_id, author_id, title, content, active, created_at, updated_at }[]` | done |
| POST | `from('bot_knowledge').insert({ patient_id, title, content })` | patient's care team; author and hospital fill in | note | done |
| PATCH/DELETE | `from('bot_knowledge').update({ title?, content?, active? }).eq('id', id)` / `.delete()` | patient's care team. `active: false` hides a note from the bot | note | done |
| GET | `from('bot_decisions').select().eq('conversation_id', id)` | staff who can read the chat | `{ id, conversation_id, message_id, reply_id, escalation_id, action: answered\|small_talk\|escalated\|held, reason, cited_knowledge_ids, model, created_at }[]` | done |
| GET | `from('alerts').select('*, escalation:escalations(*)').is('read_at', null).order('created_at', { ascending: false })` | doctors: own alerts | `{ id, recipient_id, hospital_id, kind: 'escalation', escalation_id, read_at, created_at }[]` | done |
| PATCH | `from('alerts').update({ read_at: new Date().toISOString() }).eq('id', id)` | own alerts | alert | done |
| realtime | `channel().on('postgres_changes', { table: 'alerts', event: 'INSERT' })` | doctors | new alerts for the dashboard | done |

`escalations` also gained `source: patient|bot` and `message_id` (the patient message that triggered it).

## Session log

Newest first. One entry per session:

```md
### YYYY-MM-DD · Name
- **Did:** what changed
- **Files:** main files/areas touched
- **Next:** what should happen next
- **Notes:** blockers, decisions, gotchas (optional)
```

### 2026-10-17 · Andrew (chatbot)
- **Did:**
  - Built the chatbot backend: care-team notes (`bot_knowledge`), the `chat` edge function (Claude Opus 5.5, escalates on any doubt), the `bot_decisions` audit trail, and doctor `alerts` raised by escalations.
  - Moved the escalation insert into `_shared/escalation.ts`, which both `escalate` and `chat` use.
  - Added 36 RLS and trigger checks plus unit tests for the safety rules. Applied and deployed on hosted (85/85 checks pass there).
- **Files:** `migrations/20261017152104_chatbot.sql`, `functions/chat/`, `functions/_shared/escalation.ts`, `functions/escalate/index.ts`, `seed.sql`, `tests/access.sql`
- **Next:**
  - Set `ANTHROPIC_API_KEY`, then run `chat/eval_live.ts` and send a test message as a demo patient.
  - Frontend: patient chat via `chat`, care-team notes screen, doctor alerts.
- **Notes:**
  - The bot only answers from notes and never from general medical knowledge.
  - Small talk gets a canned reply, so model text only reaches patients when it cites notes.
  - Alerts go to doctors only; nurses still see their patients' escalations.

### 2026-10-17 · Andrew
- **Did:** Picked Supabase. Built the hospital access model (schema, RLS, triggers), seeded demo data, deployed `admin-create-user` and `escalate` edge functions, wrote and ran RLS tests. Fixed two PR review findings in a second migration: patients can see the profile of a non-care-team doctor who replied after an escalation, and reopening an escalation clears `resolved_at` (49/49 pass).
- **Files:** `backend/supabase/migrations/20261017144002_access_model.sql`, `20261017145639_review_fixes.sql`, `backend/supabase/seed.sql`, `backend/supabase/tests/access.sql`, `backend/supabase/functions/`
- **Next:** the chatbot edge function (Claude; `escalate` only accepts a signed-in patient today, so share its insert logic in a helper the chatbot can import); escalation inbox sorted own-patients-first; try the edge functions with real demo logins.
- **Notes:** Admins can't read chats or escalations, on purpose (privacy). Opening an escalation gives every doctor in the hospital read + reply on that one conversation. Migrations are applied through the Supabase MCP, so the version in the filename matches the hosted project's migration history.
