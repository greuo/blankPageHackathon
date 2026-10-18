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
  - Sign-in: the app is **login-only** (email + password) since 2026-10-17, at the user's request.
    - `config.toml` has `[auth] enable_signup = false`. GoTrue treats anonymous sign-in as a sign-up, so this also turns guests off.
    - **Hosted still has sign-ups and guests on** until the dashboard switch (Authentication → Sign In / Providers → "Allow new users to sign up") is turned off. That is waiting on the login gate being merged. After it is off, `GET /auth/v1/settings` shows `disable_signup: true`.
    - The sign-up trigger still creates the `patients` row for every new user, so accounts made by hand (SQL, dashboard) work like any other.
    - Registration emails are not set up (no SMTP). Hosted keeps email confirmations on (`mailer_autoconfirm: false`), so re-opening sign-up later needs a mail sender first.
  - Realtime on `messages` and `care_notes`.
  - `chat` edge function, deployed, with `ANTHROPIC_API_KEY` set:
    - answers from the current care notes, including clear implications and "is this normal?" when the notes have a `normal` list
    - flags warning signs from the notes, refers everything unclear to the doctor, and sends red-flag emergencies to 911 / the clinic phone
    - rate-limited in three layers (per account, per network address, global), counted in the database: see "Chat rate limits" below
    - contract below
  - Demo data:
    - Alex Rivera, `alex@demo.example.com`. Password in Andrew's `backend/.env.local`.
    - Sample admin, `admin@demo.example.com` (id `…0103`, in `seed.sql` and created on hosted 2026-10-17). An ordinary patient with an empty care space; the only difference is `app_metadata.role = 'admin'`, which only the service role can write. No policy or function reads it yet, so it is a label, not extra access. Password: `ADMIN_PASSWORD` in `backend/.env.local` (git-ignored); `local-demo-only` after a local `db reset`.
    - a guest "Sam" (anonymous, can't be logged into)
    - each has a doctor, care notes with a `normal` list (Alex v1 + v2, Sam v1) and a short chat. Alex has a sent doctor message, Sam a used QR link.
- **Deployed, waiting on one secret:** `notify-doctor` and `view-doctor-message`, the secure-link doctor emails (contracts below). `APP_URL=https://foredge.me` and `EMAIL_FROM="Care companion <notify@mail.foredge.me>"` are set; `RESEND_API_KEY` is not, so `notify-doctor` answers 503 and saves nothing until it is.
- **Email domain:** `mail.foredge.me` is verified in Resend (DKIM, SPF and DMARC records in Cloudflare DNS for `foredge.me`), so any doctor's address works.
- **Frontend hosting:** `https://foredge.me` and `www.foredge.me` serve `frontend/dist` from the Cloudflare Worker `foredge` (static assets, SPA fallback so `/doctor-message` loads). Config `frontend/wrangler.jsonc`; deploy with `cd frontend && npm run deploy` (needs `npx wrangler login` to Andrew's Cloudflare account). The old Vercel `www` record is gone.
- **Tests (all passing):**
  - `tests/access.sql`: 94/94 on hosted.
  - `chat` unit tests: 27/27 (incl. the limit settings and the notes cap); `_shared` (limiter helpers) 7/7.
  - `tests/access.sql`: 113/115 on hosted after the migration. The 2 misses are the known `LIVE TEST` leftover (Alex has 2 doctor messages instead of 1, and his per-address daily cap is already used), not the limiter; all 21 new limiter checks pass (behaviour, bad input, only the service role can call it). They go back to green once the leftover is deleted (SQL under Known issues).
  - Limiter live on hosted through a temporary no-JWT test function (deleted): 3 rounds of 15 parallel calls against a limit of 5 let exactly 5 through each time; 7 sequential `chat`-shaped calls (9 counters) blocked the 6th and 7th on the account minute limit with `retry_after` 48 and left every counter at exactly 5 (a blocked call costs no budget on any layer).
  - Address headers on Supabase's edge (checked live): `cf-connecting-ip` is the real client address; a client-sent `CF-Connecting-IP` is rejected by Cloudflare (error 1000); client-sent `X-Real-IP` and `X-Forwarded-For` are discarded. So the per-address limit can't be dodged by spoofing.  - Live run of the bot against Claude: 15/15 cases as expected, 0 unsafe.
  - `notify-doctor` unit tests: 7/7 (token format, hashing, first-name escaping, email has no message content).
  - Doctor-message live run against temporary `-preview` deploys on hosted: 22/22 (since deleted).
- **How to run / deploy:**
  - Frontend: nothing to run, use the hosted project (URL and key in `overlap.md` → Agreed).
  - Local stack: `cd backend && supabase start && supabase db reset`. Needs Docker; seeds the demo patients with password `local-demo-only`.
  - Unit tests: `deno test --config backend/supabase/functions/chat/deno.json backend/supabase/functions/chat/`, `deno test backend/supabase/functions/_shared/` and `deno test backend/supabase/functions/notify-doctor/`
  - Deploy a function: `cd backend && supabase functions deploy <name> --project-ref repvtuxyszlqdjzciojx --use-api`. `--use-api` means no Docker. `view-doctor-message` also needs `--no-verify-jwt` (doctors have no login; `config.toml` says the same for local).
  - Schema change:
    1. Add `migrations/<timestamp>_<name>.sql`.
    2. Dry-run it on hosted together with `tests/access.sql` in one transaction that ends in an error, so it rolls back.
    3. Apply it for real and insert the matching `supabase_migrations.schema_migrations` row (version = filename timestamp), so `supabase migration list` stays in step.
    4. Rerun `tests/access.sql`.
    - Use the Supabase MCP, the SQL editor, or the Management API `POST /v1/projects/<ref>/database/query` with the CLI's token.
  - Bot behaviour change: deploy the branch as a temporary `chat-preview` function, run the cases in `chat/eval_live.ts` through it, then delete it. That way the live `chat` is never touched before merge.
- **In progress:** **strict `chat` rate limits** are **live on hosted since 2026-10-17** (PR #22: migration `20261017200000_chat_rate_limits.sql` applied and recorded, `chat` redeployed from the branch; the new `chat` answers 503 without the migration). Still to do: the end-to-end burst check through a real login (`chat/burst_live.ts`, run by a person) and the Anthropic spend limit. **Hosted still allows sign-ups and guest sign-in** (`GET /auth/v1/settings` on 2026-10-17: `disable_signup: false`, `anonymous_users: true`) even though the login gate is merged (#21): turn both off in the dashboard now, because anyone can mint guest accounts and each gets its own per-account quota. Doctor-message emails: set `RESEND_API_KEY` (currently the placeholder `re_PASTE_KEY`, so sends fail with 502) and send one real email end to end; `/doctor-message` (#17) is live on foredge.me. **Next: see "Start here: next session" below.**
- **Known issues:**
  - Leftovers from the doctor-message live test, still on hosted (the SQL cleanup was declined): one expired test message from Alex (`content` starts with `LIVE TEST`) and one anonymous test guest with doctor "Dr Test". Harmless; delete with `delete from public.doctor_messages where content like 'LIVE TEST%'; delete from auth.users where id = '7eba3d3a-d255-4809-9d93-6046f65d2d84';`
  - Supabase advisor: leaked-password protection is off (dashboard setting).
  - **Hosted sign-ups and guest sign-in are still on** (checked 2026-10-17: `disable_signup: false`, `anonymous_users: true`). Until they are off, per-account chat limits don't protect the Claude budget (a new guest = a new quota), only the address and global layers do. Dashboard → Authentication → Sign In / Providers: turn off "Allow new users to sign up" and "Allow anonymous sign-ins"; then `GET /auth/v1/settings` should show `disable_signup: true`.
  - Supabase limits anonymous sign-ups to 30/hour per IP. Turn on captcha if that's not enough. (Moot once sign-ups are off.)
  - `config.toml` has drifted from the hosted auth settings. `supabase config push` previews these changes to hosted: email confirmations on → off, `site_url` `http://localhost:3000` → `http://127.0.0.1:3000`, redirect URLs, OTP length 8 → 6, email `max_frequency` 1m → 1s, TOTP MFA on → off, plus `storage.vector`. **Don't push it whole.** Change one hosted setting through the dashboard or the Management API instead (`PATCH /v1/projects/<ref>/config/auth` with only that field), or bring `config.toml` in line with hosted first. The hosted sign-up switch was left for the dashboard because the CLI token can't be read from the keychain by a Claude session.
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

1. **Email key.** Domain, `APP_URL` and `EMAIL_FROM` are done. Create a sending API key in Resend, then `supabase secrets set RESEND_API_KEY=re_… --project-ref repvtuxyszlqdjzciojx`.
2. ~~Deploy `notify-doctor` and `view-doctor-message`~~ done. Send one real email end to end once the key is set.
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

`chat`: body `{ content }` (1-1000 characters; was 4000). Response 201 `{ patient_message, reply, action, suggest_notify_doctor }`; `action` is `answered` (from the notes or a clear implication of them, cited; symptom answers end with a fixed "contact your doctor / 911" line), `warning_sign` (the patient described a warning sign from the notes: what the notes say to do, `suggest_notify_doctor: true`), `small_talk` (fixed reply), `referred` ("check with your doctor", `suggest_notify_doctor: true`) or `emergency` (red-flag keyword: call 911 / clinic phone, no model call). 429 `{ error, code, retry_after_seconds }` (+ `Retry-After` header) when a limit is full, `code` = `rate_limited_user` | `rate_limited_ip` | `rate_limited_global`; the `error` text says how long to wait and always ends with "If this is an emergency, call 911.". 503 `code: "limiter_unavailable"` if the limits can't be checked (fails closed). Limits below. Safety rules in `chat/safety.ts` (unit tests: `deno test --config backend/supabase/functions/chat/deno.json backend/supabase/functions/chat/`); live check against Claude: `chat/eval_live.ts`.

#### Chat rate limits

Every `chat` message can cost a Claude call and the judges can't be allow-listed, so the limits are tight and layered. Only accepted messages count (a turned-away message costs nobody budget, so the global numbers are Claude calls). Counters live in `private.rate_limits`, updated atomically by `public.hit_rate_limits` (service role only), so parallel requests can't slip past and every function instance shares them.

| Layer | Per minute | Per hour | Per day | Secrets (`CHAT_LIMIT_…`) |
| --- | --- | --- | --- | --- |
| Account (one signed-in user) | 5 | 20 | 60 | `USER_MIN`, `USER_HOUR`, `USER_DAY` |
| Network address (`cf-connecting-ip`, else `x-real-ip`; stored hashed) | 8 | 40 | 150 | `IP_MIN`, `IP_HOUR`, `IP_DAY` |
| Global (everybody together: the spending cap) | 15 | 100 | 400 | `GLOBAL_MIN`, `GLOBAL_HOUR`, `GLOBAL_DAY` |

- Change one without a redeploy: `supabase secrets set CHAT_LIMIT_GLOBAL_DAY=150 --project-ref repvtuxyszlqdjzciojx`. A bad value (typo, negative) keeps the default; `0` blocks that limit completely, so `CHAT_LIMIT_GLOBAL_DAY=0` pauses the chat for everyone.
- Also bounded per call: message 1,000 characters, 12 turns of history (each cut to 1,000), notes cut to 20,000 characters. Defined in `chat/index.ts` / `chat/limits.ts`.
- Limiter unreachable (e.g. migration missing) = `chat` answers 503 instead of running unlimited.
- Trade-offs: the global cap can lock out everyone for the rest of the window if someone burns it (they need an account, so keep sign-ups off); judges behind one venue network share the per-address numbers; if all judges share the demo login they share the account numbers.
- A limiter for another function: `_shared/ratelimit.ts` (`checkLimits`, `envInt`, `clientIp`) is generic; give it your own keys.
- Not code: set a monthly spend limit in the Anthropic console for the key's workspace; that is the only cap that holds even if everything above is bypassed.

`notify-doctor`: body `{ doctor_id, content }` (one of my doctors; content 1-4000 characters). Saves the message with a random 32-byte token (only its sha256 is stored) and emails `recipient_email` a fixed notice: "Your patient <first name> sent you a message", the link `APP_URL/doctor-message#<token>` (expires in 7 days), "not for emergencies". No message content in the email. Response 201 `{ id, expires_at }`. Errors carry `{ error, code? }`: 400 bad body or `code: "doctor_has_no_email"`; 401; 403 `code: "guest_must_sign_up"` (ask the guest to add an email); 404 not my doctor; 429 `code: "patient_rate_limited" | "recipient_rate_limited"`; 502 the email failed (nothing saved, try again); 503 email not configured. The patient sees the doctor opened it via `doctor_messages.opened_at`. Secret `EMAIL_DEV_MODE=true` skips the email and returns `dev_link` instead (demo fallback only).

`view-doctor-message`: no login (`verify_jwt = false`). Body `{ token }` (the part after `#`). Response 200 `{ content, created_at, expires_at, opened_at, patient_first_name, doctor_name, care_notes: { version, content, entered_via, created_at } | null }`; sets `opened_at` on the first open. Errors: 400 malformed token, 404 unknown token, 410 `code: "expired"` ("ask your patient to send it again"), 429 too many tries from one IP (30 per 10 minutes). Responses are `Cache-Control: no-store`. Call it with `supabase.functions.invoke('view-doctor-message', { body: { token } })` from a signed-out client.

### supabase-js cheat sheet

RLS filters everything to the caller, so no permission `where` is needed (updates and deletes still need a filter).

```js
// Sign in. Login-only: signInWithPassword is the only way in. The next two stop working once
// sign-ups are off (config.toml has them off; hosted after the dashboard switch).
await supabase.auth.signInAnonymously()                // guest (off with sign-ups)
await supabase.auth.signUp({ email, password, options: { data: { display_name } } })  // (off)
await supabase.auth.signInWithPassword({ email, password })
await supabase.auth.signOut({ scope: 'local' })        // this browser only

// Guest → email account: same user id, keeps all data (only while guests exist)
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

### 2026-10-17 · Andrew (strict chat rate limits)
- **Did:** The user wants only the judges to be able to use the Claude-backed chat but can't allow-list people they don't know, so the limits had to be tight and hold even against strangers. The old per-patient limit (20/10 min, 200/day, counted from `messages` before the insert) capped nothing: hosted still allows guest sign-ups (anyone mints accounts, each with its own quota) and parallel requests all passed the count before any insert. Replaced with a database-backed limiter: three layers (account, network address, global) over minute / hour / day, atomic upsert counters, a blocked call undoes all its increments so only accepted messages count, fails closed (503) if the limiter is unreachable, accurate `retry_after_seconds` + `Retry-After`, secrets to tune or pause (`CHAT_LIMIT_*`). Also bounded the cost of one call: message 1,000 chars (was 4,000), 12 turns of history (was 40), notes capped at 20,000 chars.
- **Files:** `migrations/20261017200000_chat_rate_limits.sql`, `functions/_shared/ratelimit.ts` (+ test), `functions/_shared/http.ts` (`json` takes extra headers), `functions/chat/limits.ts` (+ test), `chat/burst_live.ts` (live burst check, run by a person), `chat/index.ts`, `chat/notes.ts` (`capNotes`), `tests/access.sql`, `PLAN.md`, `overlap.md`, `todo.md`, this file
- **Next:** (1) turn off sign-ups AND anonymous sign-ins on hosted (dashboard); (2) run `chat/burst_live.ts` with a real login (see its header) to see a burst get 429s through the deployed function; (3) set a monthly spend limit on the Anthropic key. Done in this session: migration applied and recorded, `chat` deployed, `access.sql` rerun, limiter and address headers checked live.
- **Notes:** Written in a separate worktree (`.claude/worktrees/chat-rate-limits`) because another session had uncommitted bot-prompt edits to `chat/bot.ts`, `index.ts`, `safety.ts` in the shared checkout; this branch is cut from `main` without them, so expect a small merge in `chat/index.ts` for whoever lands the other (different lines). `x-forwarded-for` is not used for the address limit (its first entry is client-written). The 4000 → 1000 character cap is a contract change for the frontend (`overlap.md`).

### 2026-10-17 · Andrew (care-notes sync: the app's instructions now reach the bot)
- **Did:** frontend fix on the backend contract: before every chat question (and best-effort on saving instructions) the app inserts a new `care_notes` version `{ instructions }` linked to the patient's `doctors` row (created/updated from the locally saved doctor), so the deployed `chat` bot answers from the same notes the app shows instead of referring everything. Richer structured notes (keys beyond `instructions`) are never overwritten. `ensureDoctor` now also keeps name/email in step.
- **Files:** `frontend/src/data/supabase.ts` (`syncCareNotes`, `ensureDoctor`), `frontend/src/patient/Assistant.tsx`, `frontend/src/patient/Instructions.tsx`, tests (`supabase.sync.test.ts`, `Assistant.test.tsx`). Branch `feat/ai-chat-binding`, on top of the chat-binding commit 63db7ab.
- **Next:** merge the PR; frontend may add a "What's normal" / warning-signs field to Add instructions so those answers cite structured items.
- **Notes:** verified live on hosted as a fresh guest: no notes → referred; after sync → cited answer ("no swimming until stitches out"), "is this normal?" answered from the normal line with the safety footer, dose change → referred with "Send to my doctor" shown. Backend itself unchanged.

### 2026-10-17 · Andrew (login page, sign-ups off, sample admin)
- **Did:** The user asked for a login page, registration turned off (no registration emails) and a sample admin account. Backend: `config.toml` `[auth] enable_signup = false`; `admin@demo.example.com` added to `seed.sql` and created on hosted (bcrypt hash computed locally, so the password never went through chat; stored as `ADMIN_PASSWORD` in `backend/.env.local`); checked hosted `signInWithPassword` for the admin (200) and that a wrong password and an unknown email give the identical `invalid_credentials` 400. Frontend, written from this backend session at the user's request: `frontend/src/auth/` login page + `AuthGate`, `PatientApp` sign-out and name greeting, sign-in helpers at the top of `data/supabase.ts`, 38 new tests (frontend suite: 123 passing, mutation-checked). Ran an independent security / regression / UX review (13 agents, each finding re-checked by a skeptic) and fixed what it confirmed: a leftover guest session skipped the login page (now treated as signed out and dropped); the local demo data was shared by every account on a browser and got uploaded under the next account (now one key per account, `patientStore.setOwner`); the new sign-out icon pushed the header past the screen at 320px and 851-868px; the revealed password field lost its styling; no visible loading state; field errors weren't announced; focus fell to the page body after sign-in/out; the seeded chat and report still said "Alex" for other accounts. Not changed: an expired session opened offline shows the login page after about 30 seconds; and demo data typed before login existed stays under the old key, so accounts start from the prepared demo.
- **Files:** `backend/supabase/config.toml`, `backend/supabase/seed.sql`, `frontend/src/auth/*`, `frontend/src/data/supabase.ts` (top block), `frontend/src/data/supabase.auth.test.ts`, `frontend/src/patient/PatientApp.tsx`, `PatientApp.auth.test.tsx`, `store.ts` + `store.owner.test.ts`, `model.ts` (seed takes a name), `patient.css` (header fit), `frontend/src/App.tsx` + `App.test.tsx`, `PLAN.md`, `overlap.md`, `todo.md`, this file
- **Next:** merge the login gate, then turn off "Allow new users to sign up" on hosted (dashboard) and confirm `GET /auth/v1/settings` says `disable_signup: true`. Team to ack that guests and self sign-up are gone (changes `overlap.md` → Agreed → Auth).
- **Notes:** I could not flip the hosted switch myself: the permission check denied reading the Supabase CLI token from the keychain, which the Management API call needs. `supabase config push` is not an option either: it would rewrite eight unrelated hosted auth settings (see Known issues). Nothing is committed from this session; the frontend files sit in the shared checkout beside another Claude session's chat-binding work.
### 2026-10-17 · Andrew (remove the Claude PR review)
- **Did:** Removed the broken Claude review from CI: deleted the `claude-review` job from `.github/workflows/pr-checks.yml` (the deterministic conflict check stays), updated `README.md` and the two `CLAUDE.md` lines that described it. `@claude` PR/issue comments (`claude.yml`) and `conflict-watch.yml` are untouched. No backend code changed.
- **Files:** `.github/workflows/pr-checks.yml`, `README.md`, `CLAUDE.md`, `overlap.md`, this file
- **Next:** "Claude review" must also be removed from `main`'s required status checks (repo settings → branch protection) or no PR can merge; Andrew is doing that by hand since sessions can't.
- **Notes:** PRs now merge on the conflict check alone — review each other's PRs manually, or ask `@claude review this PR` in a comment when wanted.

### 2026-10-17 · Andrew (email domain + hosting on foredge.me)
- **Did:** Verified `mail.foredge.me` in Resend and added its DKIM/SPF/DMARC records in Cloudflare. Removed the old `www` → Vercel record and hosted the frontend on Cloudflare at `foredge.me` + `www` (Worker `foredge`, SPA fallback). Set `APP_URL`/`EMAIL_FROM`, deployed `notify-doctor` and `view-doctor-message` (smoke: 400 bad token, 401 not signed in).
- **Files:** `frontend/wrangler.jsonc`, `frontend/package.json` (wrangler + `deploy` script), `frontend/.gitignore`, docs.
- **Next:** set `RESEND_API_KEY`, redeploy the frontend so `/doctor-message` (#17) is live, send one real email end to end.
- **Notes:** Resend free plan allows one domain and the account already had `tidyweek.app`; adding `mail.foredge.me` worked anyway. The old Vercel project still exists (not signed in there); delete it from the Vercel dashboard.

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
