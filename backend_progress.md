# Backend progress

Owned by the backend side (Andrew, Sharon). Only backend sessions edit this file. Frontend: read it, but put anything for us in `overlap.md`.

## Current state

Snapshot of what exists right now. Rewrite it each session; don't append.

- **Stack:** Supabase (Postgres + Supabase Auth + Row Level Security + Edge Functions). Hosted project `blankPageHackathon` (ref `repvtuxyszlqdjzciojx`, us-east-1). Code in `backend/supabase/`.
- **How to run:** nothing to run for the frontend: use the hosted project (URL and key in `overlap.md` → Agreed). Local stack: `cd backend && supabase start && supabase db reset` (needs Docker; seeds the demo patients with password `local-demo-only`). Schema changes: add a file under `backend/supabase/migrations/`, apply it, rerun `backend/supabase/tests/access.sql`.
- **Working:**
  - Patient-only model from `PLAN.md` (`migrations/20261017154913_patient_only.sql`); the hospital model is gone. Every signed-in user (anonymous guest or email) is a patient and sees and edits only their own rows. 92/92 checks in `tests/access.sql` pass on the hosted project.
  - Review fixes (`migrations/20261017170000_patient_only_hardening.sql`): new tables start read-only for API roles; care-note versions come from a per-patient counter (`patients.last_note_version`) so they're never reused; `doctor_messages` insert trigger enforces the anti-spam limits in `PLAN.md` (email account only, 5/hour + 20/day per patient, 10/day per recipient address, doctor must have an email).
  - Anonymous sign-in is on, locally and on hosted.
  - Sign-up trigger creates the `patients` row for every new user, guest or email. A guest who adds an email keeps the same user id, so keeps their data.
  - Realtime on `messages` and `care_notes` (so notes saved from the doctor's own phone show up live).
  - Demo data on the hosted project: Alex Rivera (`alex@demo.example.com`; password in Andrew's `backend/.env.local`, ask him) and a guest "Sam" (anonymous, can't be logged into). Each has a doctor, care notes (Alex: v1 + v2) and chat messages; Alex has a sent doctor message, Sam a used QR link. The old hospital demo logins are deleted.
  - Edge functions: `chat` (below) and the shared helper `functions/_shared/http.ts` (CORS, `json`, `serviceClient`, `callerClient`, `getCaller` → `{ user }`). `admin-create-user` and `escalate` are deleted from the repo and the hosted project.
- **In progress:** nothing. Next: set `ANTHROPIC_API_KEY`, then `notify-doctor` / `view-doctor-message`, then `entry-link` / `doctor-entry` (see `todo.md`).
- **Known issues:**
  - **`ANTHROPIC_API_KEY` is not set on hosted.** Until it is, `chat` still works but tells the patient to check with their doctor for every question (red flags still get the 911 notice).
  - PR #4 is closed as superseded; its migration `20261017152104_chatbot.sql` stays in `migrations/` so the repo matches the hosted history (its tables are dropped again by the patient-only migration).
  - Supabase advisor: leaked-password protection is off (dashboard setting).

### Data model

Every table has RLS: a signed-in user (guest or email) gets only rows where `patient_id` (for `patients`: `id`) is their own user id. Not signed in (`anon`) sees nothing. `patient_id` defaults to the caller, so inserts can leave it out.

| Table | Columns | Patient can |
| --- | --- | --- |
| `patients` | `id` (= auth user id), `display_name`, `last_note_version` (server-managed), `created_at` | read; update `display_name`. Created on sign-up (from user metadata `display_name` or `full_name`) |
| `doctors` | `id`, `patient_id`, `name` (required), `email`, `clinic`, `clinic_phone`, `created_at` | read, insert, update (not `patient_id`), delete. Deleting a doctor sets `doctor_id` to null on their notes and doctor messages |
| `care_notes` | `id`, `patient_id`, `doctor_id` (one of my doctors, or null), `version` (1, 2, …, set by the server), `content` (JSON object, below), `entered_via` (`patient_phone` \| `qr`), `created_at` (set by the server) | read, insert, delete. No update: each save is a new version. Inserts must be `entered_via = 'patient_phone'` (the default); `qr` is written only by `doctor-entry` |
| `current_care_notes` (view) | same as `care_notes` | read: the latest version (one row, or none yet) |
| `messages` | `id`, `patient_id`, `sender` (`patient` \| `bot`), `content` (non-empty), `created_at` | read; insert with `sender = 'patient'` (the default). No update/delete. Bot replies come from `chat` |
| `doctor_messages` | `id`, `patient_id`, `doctor_id`, `content`, `token_hash`, `expires_at` (+7 days), `opened_at`, `created_at` | read only. Written by `notify-doctor`; `opened_at` set by `view-doctor-message`. Insert trigger enforces the anti-spam limits (`PLAN.md`) |
| `entry_links` | `id`, `patient_id`, `token_hash`, `expires_at` (+30 min), `used_at`, `created_at` | read only. Written by `entry-link` / `doctor-entry` |

- `care_notes.content`: `{ reason, medications: [{ name, dose, when, until }], instructions: [...], warning_signs: [{ sign, action }], contact_rules, follow_up }`. Only "is a JSON object" is enforced; the shape is a convention.
- Tokens are stored as sha256 hex; the raw token only lives in the link.

### Edge functions

Patient functions: `supabase.functions.invoke(name, { body })` while signed in (401 otherwise). Request/response contracts go here as each one lands.

| Function | Who calls it | What it does | Status |
| --- | --- | --- | --- |
| `chat` | patient | message + current care notes → Claude; stores and returns the bot reply; flags "should notify doctor" | deployed (needs `ANTHROPIC_API_KEY`) |
| `notify-doctor` | patient | creates a `doctor_messages` row, emails the doctor a link | planned |
| `view-doctor-message` | anyone with the link | checks the token; returns the message, patient first name, current notes | planned |
| `entry-link` | patient | creates a QR token (`entry_links`) | planned |
| `doctor-entry` | anyone with a QR token | returns current notes, saves a new version (`entered_via = 'qr'`), marks the token used | planned |

`chat`: body `{ content }` (1-4000 characters). Response 201 `{ patient_message, reply, action, suggest_notify_doctor }`; `action` is `answered` (from the notes, cited), `small_talk` (fixed reply), `referred` ("check with your doctor", `suggest_notify_doctor: true`) or `emergency` (red-flag keyword: call 911 / clinic phone, no model call). 429 `{ error, retry_after_seconds }` past 20 messages per 10 minutes or 200 per day. Safety rules in `chat/safety.ts` (unit tests: `deno test --config backend/supabase/functions/chat/deno.json backend/supabase/functions/chat/`); live check against Claude: `chat/eval_live.ts`.

### supabase-js cheat sheet

RLS filters everything to the caller, so no permission `where` is needed (updates and deletes still need a filter).

```js
// Sign in
await supabase.auth.signInAnonymously()                // guest (hosted: needs the dashboard toggle)
await supabase.auth.signUp({ email, password, options: { data: { display_name } } })
await supabase.auth.signInWithPassword({ email, password })

// Guest → email account: same user id, keeps all data
await supabase.auth.updateUser({ email })     // user confirms the email if confirmations are on
await supabase.auth.updateUser({ password })  // once the email is confirmed
// (email already has an account → error; sign in to it instead, guest data doesn't move)

// Me, doctors
const { data: me } = await supabase.from('patients').select().single()
await supabase.from('patients').update({ display_name }).eq('id', me.id)
await supabase.from('doctors').insert({ name, email, clinic, clinic_phone }).select().single()

// Care notes: current, save (= new version), history
const { data: notes } = await supabase.from('current_care_notes').select().maybeSingle()
await supabase.from('care_notes').insert({ doctor_id, content }).select().single()
await supabase.from('care_notes').select().order('version', { ascending: false })

// Chat: send through `chat` (saves both messages); read history + live updates from `messages`
await supabase.from('messages').select().order('created_at')
const { data } = await supabase.functions.invoke('chat', { body: { content } })
supabase.channel('chat')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => add(p.new))
  .subscribe()
```

## Session log

Newest first. One entry per session:

```md
### YYYY-MM-DD · Name
- **Did:** what changed
- **Files:** main files/areas touched
- **Next:** what should happen next
- **Notes:** blockers, decisions, gotchas (optional)
```

### 2026-10-17 · Andrew (review fixes + chat)
- **Did:** Fixed the open review findings from #5 and #6. New migration: default privileges so future tables start read-only, never-reused care-note versions, anti-spam limits on `doctor_messages`. Rewrote `chat` for the patient-only tables, reusing PR #4's safety design (red-flag screen, cited-answers-only, everything else refers to the doctor), with the prompt-escaping fix from #4's review, negation handling in the red-flag screen, per-patient rate limits, and support for the frontend's free-text instructions. Turned on anonymous sign-in on hosted. Documented the multi-doctor and content-shape decisions in `PLAN.md`.
- **Files:** `migrations/20261017170000_patient_only_hardening.sql`, `functions/chat/`, `tests/access.sql`, `PLAN.md`, `overlap.md`, `todo.md`, this file
- **Next:** set `ANTHROPIC_API_KEY` and run `chat/eval_live.ts`; then `notify-doctor` / `view-doctor-message`.
- **Notes:** 92/92 access checks and 12/12 `chat` unit tests pass. The doctor-message limits live in the database, so `notify-doctor` gets them for free; map the trigger's `hint` (`guest_must_sign_up`, `patient_rate_limited`, `recipient_rate_limited`, `doctor_has_no_email`) to user-facing errors.

### 2026-10-17 · Andrew (patient-only migration)
- **Did:** Replaced the hospital model with the patient-only model from `PLAN.md`: `patients`, `doctors`, versioned `care_notes` + `current_care_notes` view, `messages`, `doctor_messages`, `entry_links`; own-rows-only RLS for guests and email users; sign-up trigger; realtime on `messages` + `care_notes`. Dropped hospitals, profiles, roles, care teams, conversations, escalations and PR #4's `bot_knowledge` / `bot_decisions` / `alerts`. Deleted `admin-create-user` and `escalate` (repo + hosted); `getCaller` returns just `{ user }`. Anonymous sign-in on locally. New seed (Alex + guest Sam), rewrote `tests/access.sql` (82/82 pass on hosted).
- **Files:** `backend/supabase/migrations/20261017154913_patient_only.sql`, `20261017152104_chatbot.sql` (copied from PR #4), `seed.sql`, `tests/access.sql`, `config.toml`, `functions/_shared/http.ts`, removed `functions/admin-create-user/` and `functions/escalate/`
- **Next:** allow anonymous sign-ins on hosted (dashboard); rewrite + redeploy `chat` for the new tables; close PR #4 as superseded; then `notify-doctor` / `view-doctor-message` and `entry-link` / `doctor-entry`.
- **Notes:** PR #4's `20261017152104_chatbot.sql` was already applied on hosted, so it's copied into this branch to keep the repo in step with the hosted migration history; the patient-only migration drops its tables (`if exists`, so a fresh `db reset` works too). No update grant on `care_notes`: a save is a new version; deleting the latest makes the previous one current. Edge functions write `doctor_messages`, `entry_links` and bot messages with the service role.

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
