# Backend progress

Owned by the backend side (Andrew, Sharon). Only backend sessions edit this file. Frontend: read it, but put anything for us in `overlap.md`.

## Current state

Snapshot of what exists right now. Rewrite it each session; don't append.

- **Stack:** Supabase (Postgres + Supabase Auth + Row Level Security + Edge Functions). Hosted project `blankPageHackathon` (ref `repvtuxyszlqdjzciojx`, us-east-1). Code in `backend/supabase/`. Chat model: Claude Opus 5.5 (`claude-opus-5-5`) through `@anthropic-ai/sdk`.
- **Working on hosted (all merged to `main` and deployed):**
  - Patient-only model from `PLAN.md` (`migrations/20261017154913_patient_only.sql`). Every signed-in user, anonymous guest or email, is a patient and sees and edits only their own rows.
  - Hardening (`migrations/20261017170000_patient_only_hardening.sql`):
    - new tables start read-only for the API roles
    - care-note versions are never reused (`patients.last_note_version`)
    - the `doctor_messages` insert trigger enforces the anti-spam limits: email account only, 5/hour and 20/day per patient, 10/day per recipient address (stored in `recipient_email`), and the doctor must have an email
  - Anonymous (guest) sign-in is on, locally and on hosted. The sign-up trigger creates the `patients` row for every new user; a guest who adds an email keeps the same id and data.
  - Realtime on `messages` and `care_notes`.
  - `chat` edge function, deployed, with `ANTHROPIC_API_KEY` set:
    - answers from the current care notes, including clear implications and "is this normal?" when the notes have a `normal` list
    - flags warning signs from the notes, refers everything unclear to the doctor, and sends red-flag emergencies to 911 / the clinic phone
    - rate-limited per patient
    - contract below
  - Demo data:
    - Alex Rivera, `alex@demo.example.com`. Password in Andrew's `backend/.env.local`.
    - a guest "Sam" (anonymous, can't be logged into)
    - each has a doctor, care notes with a `normal` list (Alex v1 + v2, Sam v1) and a short chat. Alex has a sent doctor message, Sam a used QR link.
- **Built, not deployed yet (PR `backend/doctor-message-link`):** `notify-doctor` and `view-doctor-message`, the secure-link doctor emails. Contracts below. Deploy both after merge, and only once the email secrets are set (see "Start here" step 1); until then `notify-doctor` answers 503 and saves nothing.
- **Tests (all passing):**
  - `tests/access.sql`: 94/94 on hosted.
  - `chat` unit tests: 19/19.
  - Live run of the bot against Claude: 15/15 cases as expected, 0 unsafe.
  - `notify-doctor` unit tests: 7/7 (token format, hashing, first-name escaping, email has no message content).
  - Doctor-message live run against temporary `-preview` deploys on hosted: 22/22 (since deleted).
- **How to run / deploy:**
  - Frontend: nothing to run, use the hosted project (URL and key in `overlap.md` → Agreed).
  - Local stack: `cd backend && supabase start && supabase db reset`. Needs Docker; seeds the demo patients with password `local-demo-only`.
  - Unit tests: `deno test --config backend/supabase/functions/chat/deno.json backend/supabase/functions/chat/` and `deno test backend/supabase/functions/notify-doctor/`
  - Deploy a function: `cd backend && supabase functions deploy <name> --project-ref repvtuxyszlqdjzciojx --use-api`. `--use-api` means no Docker. `view-doctor-message` also needs `--no-verify-jwt` (doctors have no login; `config.toml` says the same for local).
  - Schema change:
    1. Add `migrations/<timestamp>_<name>.sql`.
    2. Dry-run it on hosted together with `tests/access.sql` in one transaction that ends in an error, so it rolls back.
    3. Apply it for real and insert the matching `supabase_migrations.schema_migrations` row (version = filename timestamp), so `supabase migration list` stays in step.
    4. Rerun `tests/access.sql`.
    - Use the Supabase MCP, the SQL editor, or the Management API `POST /v1/projects/<ref>/database/query` with the CLI's token.
  - Bot behaviour change: deploy the branch as a temporary `chat-preview` function, run the cases in `chat/eval_live.ts` through it, then delete it. That way the live `chat` is never touched before merge.
- **In progress:** doctor-message PR open; needs the Resend key and the frontend's `/doctor-message` page. **Next: see "Start here: next session" below.**
- **Known issues:**
  - Demo email uses Resend's test sender `onboarding@resend.dev` (no domain): it only delivers to the Resend account owner's address, so the demo doctor's email must be that address. Other recipients fail with 502 and nothing is saved.
  - Leftovers from the doctor-message live test, still on hosted (the SQL cleanup was declined): one expired test message from Alex (`content` starts with `LIVE TEST`) and one anonymous test guest with doctor "Dr Test". Harmless; delete with `delete from public.doctor_messages where content like 'LIVE TEST%'; delete from auth.users where id = '7eba3d3a-d255-4809-9d93-6046f65d2d84';`
  - Supabase advisor: leaked-password protection is off (dashboard setting).
  - Supabase limits anonymous sign-ups to 30/hour per IP. Turn on captcha if that's not enough.
  - PR #4 (hospital-model chatbot) is closed. Its migration `20261017152104_chatbot.sql` stays in `migrations/` so the repo matches the hosted history; the patient-only migration drops its tables again.

## Start here: next session

**State at handoff (2026-10-17):**
- No open PRs.
- `main` is deployed.
- All tests pass.
- Frontend (#7, #8, #10) is a browser-local demo, not yet bound to Supabase (`frontend_progress.md`).

Today's work, in order (details in the session log):
1. hospital access model (#2)
2. pivot to patient-only (#5, #6), hospital chatbot #4 closed
3. review fixes and the `chat` rewrite (#9)
4. guest sign-in turned on
5. API key set
6. bot refers less (#11)

Backend features to build next, in this order. Each one goes in its own PR with tests and a contract added to the Edge functions table below:

1. **Email setup (no domain needed for the demo).** Sign up at resend.com with the inbox the demo doctor will use, create an API key, then:
   `supabase secrets set RESEND_API_KEY=re_… EMAIL_FROM="Care companion <onboarding@resend.dev>" APP_URL=<frontend URL> --project-ref repvtuxyszlqdjzciojx`. Set the demo doctor's email to that same inbox.
2. **Merge the doctor-message PR, then deploy** `notify-doctor` and `view-doctor-message` (`--no-verify-jwt` on the second). Send one real email end to end.
3. ~~`notify-doctor`~~ and ~~`view-doctor-message`~~: built, contracts in the Edge functions table. Decisions: if the email fails the row is deleted (502), so it doesn't count against the limits; the per-IP limit on `view-doctor-message` is in memory per instance (tokens are 256-bit, so it only stops hammering); an expired link answers 410 `code: "expired"`.
4. **`entry-link`** (patient): create an `entry_links` token (30 minutes, one use) and return `{ url: APP_URL/doctor-entry#<token>, expires_at }` for the QR code.
5. **`doctor-entry`** (anyone with a QR token, `verify_jwt = false`).
   - `{ token }` returns the current notes, so the form opens pre-filled (`PLAN.md` → multi-doctor rule).
   - `{ token, content, doctor? }` saves a new version with `entered_via = 'qr'` and marks `used_at` in the same transaction, so the token works once.
6. **Optional:** let the doctor reply from the message page, with the reply showing in the patient's chat (needs a `doctor` sender or a separate table).

Frontend needs for these:
- two public pages, `/doctor-message` and `/doctor-entry`, that read the token from the URL hash
- a "Send to my doctor" button wired to `notify-doctor`
- a QR screen for `entry-link`
- the "What's normal" field and the `warning_sign` chat action (already requested in `overlap.md`)

Agree the routes with frontend in `overlap.md` before building 2-5.

### Data model

Every table has RLS: a signed-in user (guest or email) gets only rows where `patient_id` (for `patients`: `id`) is their own user id. Not signed in (`anon`) sees nothing. `patient_id` defaults to the caller, so inserts can leave it out.

| Table | Columns | Patient can |
| --- | --- | --- |
| `patients` | `id` (= auth user id), `display_name`, `last_note_version` (server-managed), `created_at` | read; update `display_name`. Created on sign-up (from user metadata `display_name` or `full_name`) |
| `doctors` | `id`, `patient_id`, `name` (required), `email`, `clinic`, `clinic_phone`, `created_at` | read, insert, update (not `patient_id`), delete. Deleting a doctor sets `doctor_id` to null on their notes and doctor messages |
| `care_notes` | `id`, `patient_id`, `doctor_id` (one of my doctors, or null), `version` (1, 2, …, set by the server), `content` (JSON object, below), `entered_via` (`patient_phone` \| `qr`), `created_at` (set by the server) | read, insert, delete. No update: each save is a new version. Inserts must be `entered_via = 'patient_phone'` (the default); `qr` is written only by `doctor-entry` |
| `current_care_notes` (view) | same as `care_notes` | read: the latest version (one row, or none yet) |
| `messages` | `id`, `patient_id`, `sender` (`patient` \| `bot`), `content` (non-empty), `created_at` | read; insert with `sender = 'patient'` (the default). No update/delete. Bot replies come from `chat` |
| `doctor_messages` | `id`, `patient_id`, `doctor_id`, `recipient_email` (set by the server), `content`, `token_hash`, `expires_at` (+7 days), `opened_at`, `created_at` | read only. Written by `notify-doctor`; `opened_at` set by `view-doctor-message`. Insert trigger enforces the anti-spam limits (`PLAN.md`) |
| `entry_links` | `id`, `patient_id`, `token_hash`, `expires_at` (+30 min), `used_at`, `created_at` | read only. Written by `entry-link` / `doctor-entry` |

- `care_notes.content`: `{ reason, normal: [...], medications: [{ name, dose, when, until }], instructions: [...], warning_signs: [{ sign, action }], contact_rules, follow_up }`. Only "is a JSON object" is enforced; the shape is a convention. `normal` (what's expected after the visit) is optional but lets the bot answer "is this normal?".
- Tokens are stored as sha256 hex; the raw token only lives in the link.

### Edge functions

Patient functions: `supabase.functions.invoke(name, { body })` while signed in (401 otherwise). Request/response contracts go here as each one lands.

| Function | Who calls it | What it does | Status |
| --- | --- | --- | --- |
| `chat` | patient | message + current care notes → Claude; stores and returns the bot reply; flags "should notify doctor" | deployed, live |
| `notify-doctor` | patient (email account) | creates a `doctor_messages` row, emails the doctor a link | built, in PR; deploy after merge + secrets |
| `view-doctor-message` | anyone with the link | checks the token; returns the message, patient first name, current notes | built, in PR; deploy after merge |
| `entry-link` | patient | creates a QR token (`entry_links`) | planned |
| `doctor-entry` | anyone with a QR token | returns current notes, saves a new version (`entered_via = 'qr'`), marks the token used | planned |

`chat`: body `{ content }` (1-4000 characters). Response 201 `{ patient_message, reply, action, suggest_notify_doctor }`; `action` is `answered` (from the notes or a clear implication of them, cited; symptom answers end with a fixed "contact your doctor / 911" line), `warning_sign` (the patient described a warning sign from the notes: what the notes say to do, `suggest_notify_doctor: true`), `small_talk` (fixed reply), `referred` ("check with your doctor", `suggest_notify_doctor: true`) or `emergency` (red-flag keyword: call 911 / clinic phone, no model call). 429 `{ error, retry_after_seconds }` past 20 messages per 10 minutes or 200 per day. Safety rules in `chat/safety.ts` (unit tests: `deno test --config backend/supabase/functions/chat/deno.json backend/supabase/functions/chat/`); live check against Claude: `chat/eval_live.ts`.

`notify-doctor`: body `{ doctor_id, content }` (one of my doctors; content 1-4000 characters). Saves the message with a random 32-byte token (only its sha256 is stored) and emails `recipient_email` a fixed notice: "Your patient <first name> sent you a message", the link `APP_URL/doctor-message#<token>` (expires in 7 days), "not for emergencies". No message content in the email. Response 201 `{ id, expires_at }`. Errors carry `{ error, code? }`: 400 bad body or `code: "doctor_has_no_email"`; 401; 403 `code: "guest_must_sign_up"` (ask the guest to add an email); 404 not my doctor; 429 `code: "patient_rate_limited" | "recipient_rate_limited"`; 502 the email failed (nothing saved, try again); 503 email not configured. The patient sees the doctor opened it via `doctor_messages.opened_at`. Secret `EMAIL_DEV_MODE=true` skips the email and returns `dev_link` instead (demo fallback only).

`view-doctor-message`: no login (`verify_jwt = false`). Body `{ token }` (the part after `#`). Response 200 `{ content, created_at, expires_at, opened_at, patient_first_name, doctor_name, care_notes: { version, content, entered_via, created_at } | null }`; sets `opened_at` on the first open. Errors: 400 malformed token, 404 unknown token, 410 `code: "expired"` ("ask your patient to send it again"), 429 too many tries from one IP (30 per 10 minutes). Responses are `Cache-Control: no-store`. Call it with `supabase.functions.invoke('view-doctor-message', { body: { token } })` from a signed-out client.

### supabase-js cheat sheet

RLS filters everything to the caller, so no permission `where` is needed (updates and deletes still need a filter).

```js
// Sign in
await supabase.auth.signInAnonymously()                // guest
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

### 2026-10-17 · Andrew (remove the Claude PR review)
- **Did:** Removed the broken Claude review from CI: deleted the `claude-review` job from `.github/workflows/pr-checks.yml` (the deterministic conflict check stays), updated `README.md` and the two `CLAUDE.md` lines that described it. `@claude` PR/issue comments (`claude.yml`) and `conflict-watch.yml` are untouched. No backend code changed.
- **Files:** `.github/workflows/pr-checks.yml`, `README.md`, `CLAUDE.md`, `overlap.md`, this file
- **Next:** "Claude review" must also be removed from `main`'s required status checks (repo settings → branch protection) or no PR can merge; Andrew is doing that by hand since sessions can't.
- **Notes:** PRs now merge on the conflict check alone — review each other's PRs manually, or ask `@claude review this PR` in a comment when wanted.

### 2026-10-17 · Andrew (secure-link doctor emails)
- **Did:** Built `notify-doctor` (saves the message with a random token, emails a link-only notice through Resend, maps the trigger's limit hints to 4xx, deletes the row if the email fails) and `view-doctor-message` (no login; token + expiry check, sets `opened_at`, returns message + first name + current notes, no-store, per-IP limit). Team decision: no PIN for now, just the link + 7-day expiry. Email for the demo: Resend's test sender, no domain. Tested live through temporary `-preview` deploys (22/22), then deleted them and the temporary secrets.
- **Files:** `functions/notify-doctor/` (`index.ts`, `email.ts`, `token.ts`, `email_test.ts`), `functions/view-doctor-message/index.ts`, `config.toml`, `PLAN.md`, `overlap.md`, `todo.md`, this file
- **Next:** set the Resend secrets, merge, deploy both functions, send one real email; frontend builds `/doctor-message` and wires "Send to my doctor".
- **Notes:** Token helpers live in `notify-doctor/token.ts` (not `_shared/`); `view-doctor-message` imports them from there. Two test leftovers remain on hosted (see Known issues).

### 2026-10-17 · Andrew (docs + handoff)
- **Did:** Brought every backend and shared doc up to date for a fresh session. Rewrote "Current state", added "Start here: next session" (next features in order, with contracts), recorded how to apply migrations, deploy and test the bot safely. Ticked finished to-dos and added the next ones. Replied to stale `overlap.md` notes. Updated `PLAN.md` build status, `README.md` and the stale "no code yet" line in `CLAUDE.md` (user asked to update all docs).
- **Files:** this file, `todo.md`, `overlap.md`, `PLAN.md`, `README.md`, `CLAUDE.md`
- **Next:** see "Start here: next session".

### 2026-10-17 · Andrew (chat refers less)
- **Did:** The bot was sending too much to the doctor. It now answers clear implications of the notes ("no swimming" from "don't soak it"), answers "is this normal?" when the notes say what's expected (new optional `normal` list), and when the patient describes a warning sign from the notes it says what the notes say to do (`warning_sign`, offers Send to my doctor). Unclear workarounds, treatment changes and anything uncovered still refer. Code still requires real citations, and adds a fixed "contact your doctor / 911" line to every symptom answer. Added `normal` to the demo notes.
- **Files:** `functions/chat/` (`bot.ts` prompt + schema, `safety.ts`, tests, `eval_live.ts`), `seed.sql`, `PLAN.md`, `overlap.md`, this file
- **Next:** frontend: add a "What's normal" field to Doctor mode, handle `action: "warning_sign"`.
- **Notes:** 15/15 live cases as expected, 0 unsafe (run against a temporary `chat-preview` deploy, since deleted). 19/19 unit tests.

### 2026-10-17 · Andrew (review fixes + chat)
- **Did:** Fixed the open review findings from #5 and #6. New migration: default privileges so future tables start read-only, never-reused care-note versions, anti-spam limits on `doctor_messages`. Rewrote `chat` for the patient-only tables, reusing PR #4's safety design (red-flag screen, cited-answers-only, everything else refers to the doctor), with the prompt-escaping fix from #4's review, negation handling in the red-flag screen, per-patient rate limits, and support for the frontend's free-text instructions. Turned on anonymous sign-in on hosted. Documented the multi-doctor and content-shape decisions in `PLAN.md`.
- **Files:** `migrations/20261017170000_patient_only_hardening.sql`, `functions/chat/`, `tests/access.sql`, `PLAN.md`, `overlap.md`, `todo.md`, this file
- **Next:** set `ANTHROPIC_API_KEY` and run `chat/eval_live.ts`; then `notify-doctor` / `view-doctor-message`.
- **Notes:** 94/94 access checks and 12/12 `chat` unit tests pass. The doctor-message limits live in the database, so `notify-doctor` gets them for free; map the trigger's `hint` (`guest_must_sign_up`, `patient_rate_limited`, `recipient_rate_limited`, `doctor_has_no_email`) to user-facing errors.

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
