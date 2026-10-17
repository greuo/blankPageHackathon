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

- [ ] 2026-10-17 · Andrew: **The automatic Claude review on PRs is gone** (it was broken). Only the Conflict check runs and is required now; it's also being removed from `main`'s required status checks, after which PRs merge on the Conflict check alone. `@claude ...` comments still work (incl. `@claude resolve the merge conflicts`, or `@claude review this PR` if you want a review). Review each other's PRs manually.

- [ ] 2026-10-17 · Andrew: **The frontend is live at https://foredge.me (and `www`).** Hosted on Cloudflare as static assets with an SPA fallback, so `/doctor-message` and `/doctor-entry` load `index.html` and your code reads `location.pathname`. Deploy with `cd frontend && npm run deploy` (builds, then `wrangler deploy`; needs `npx wrangler login` to Andrew's Cloudflare account, ask him). Added in `frontend/`: `wrangler.jsonc`, `wrangler` devDependency, `deploy` script, `.wrangler/` in `.gitignore`. Emailed doctor links now point at `https://foredge.me/doctor-message#<token>` (`APP_URL`), sent from `notify@mail.foredge.me`, so the demo doctor can be any address. Anything else you build needs no env vars yet; if you add some, tell us so the deploy picks them up.
- [ ] 2026-10-17 · Andrew: **"Send to my doctor" backend is built (PR `backend/doctor-message-link`, deployed after merge).** The email to the doctor holds only "Your patient <first name> sent you a message" + a secure link (expires in 7 days); the message stays in Supabase. Contracts: `backend_progress.md` → Edge functions. What we need from you:
  - **"Send to my doctor" button:** `supabase.functions.invoke('notify-doctor', { body: { doctor_id, content } })` → 201 `{ id, expires_at }`. Show `error` from the response on failure; `code: "guest_must_sign_up"` (403) means ask the guest to add an email first. 429 = too many sends, 502 = email failed (nothing saved, retry). "Opened" status: `doctor_messages.opened_at`.
  - **Public page `/doctor-message`** (no login): read the token from `location.hash` (after `#`), call `supabase.functions.invoke('view-doctor-message', { body: { token } })`, show `content`, `patient_first_name`, `created_at` and `care_notes.content`. 410 `code: "expired"` → "This link has expired, ask your patient to send it again"; 404/400 → "This link isn't valid". Please add `<meta name="referrer" content="no-referrer">` on that page.
  - ~~Tell us the frontend's URL~~ done: `https://foredge.me` (see the note above).
  - On a non-2xx, `functions.invoke` returns `data: null`; read the body with `await error.context.json()` to get `error` / `code`.
  - ~~Demo caveat about Resend's test sender~~ gone: we send from the verified `mail.foredge.me` now.

- [ ] 2026-10-17 · Andrew: **Next backend work: "Send to my doctor" and the QR doctor entry.** Proposed routes for the two public doctor pages, token in the URL hash so it never reaches server logs:
  - `/doctor-message#<token>`: reads `view-doctor-message`; shows the patient's message and current care notes.
  - `/doctor-entry#<token>`: reads `doctor-entry`; the Doctor-mode form pre-filled with the current notes; saving makes a new version.
  - Patient side: "Send to my doctor" calls `notify-doctor` with `{ doctor_id, content }`; a QR screen calls `entry-link` and shows the returned URL as a QR code.
  - OK with these routes? Reply here and we'll build against them. Full plan: `backend_progress.md` → "Start here: next session".

- [ ] 2026-10-17 · Andrew: **`chat` now refers to the doctor less, and has a new `action`.**
  - New `action: "warning_sign"`: the patient described one of the warning signs in their notes. The reply says what the notes say to do; `suggest_notify_doctor` is true, so show "Send to my doctor" (same as `referred`).
  - Care notes can have an optional `normal` list: what's expected after the visit ("slight pinkness along the stitches for 2-3 days"). Please add a **What's normal** field to Doctor mode / the instructions page. With it the bot can answer "is this normal?"; without it, those questions go to the doctor.

- [ ] 2026-10-17 · Andrew: **`chat` is live for the patient-only tables, and guest sign-in is on hosted.**
  - Call `supabase.functions.invoke('chat', { body: { content } })` instead of inserting into `messages` yourself. It saves the patient message and the bot reply (both also arrive by realtime). Response: `{ patient_message, reply, action, suggest_notify_doctor }`, `action` is `answered` | `small_talk` | `referred` | `emergency`. When `suggest_notify_doctor` is true, offer "Send to my doctor". 429 means too many messages (20 per 10 minutes).
  - Care notes: saving your free-text instructions as `{ "instructions": "…" }` works today; the bot reads it line by line. See `PLAN.md` → Care-notes content shape.
  - "Send to my doctor" will need an email account: guests get asked to add an email first (anti-spam, `PLAN.md` → Doctor emails: abuse limits).
  - `supabase.auth.signInAnonymously()` now works on hosted.
  - ↳ 2026-10-17 · Andrew: Update: `action` can now also be `warning_sign` (note above).

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
  - ↳ 2026-10-17 · Andrew: Two lines here are out of date: `chat` is rewritten and live (use `functions.invoke('chat')`), and guest sign-in works on hosted now.
- [ ] 2026-10-17 · Andrew: **Pivot agreed by the whole team (2026-10-17), now under Agreed:** patients-only app, written up in `PLAN.md` at the repo root. No doctor/nurse/admin accounts or hospitals. Doctor enters notes in a Doctor mode on the patient's phone (optional: scan a QR and type on their own phone). Chatbot answers from those notes. Patient can use it as a guest or signed in. "Send to my doctor" emails the doctor a secure link to the message stored in Supabase. Your clinician builder maps onto Doctor mode; family access is your call. This replaces the hospital model above, so hold off binding to the current tables.
  - ↳ 2026-10-17 · Andrew: The new patient-only tables are live (note above), so no need to hold off any more.
- [ ] 2026-10-17 · Andrew: Backend is live on Supabase; see **Agreed** above for URL, key, roles and demo logins. Access model: a hospital has admin / doctor / nurse / patient accounts. Patients chat with the bot; their care team (assigned doctors + nurses) can read and reply. When a chat is forwarded (`escalations`), it's routed to the treating doctor but every doctor in the hospital sees it. Admins manage accounts and care teams but can't read chats. Full table in `backend_progress.md`.
  - ↳ 2026-10-17 · Andrew: Superseded: the hospital model and its tables are gone; see the patient-only note at the top.
- [ ] 2026-10-17 · Andrew: Question: which screens are you building first (patient chat, doctor escalation inbox, admin user management)? We'll prioritise the chatbot or any missing queries around that.
  - ↳ 2026-10-17 · Andrew: Superseded by the patient-only plan; no inbox or admin screens any more.

## Frontend → Backend

- [ ] 2026-10-17 · Claude for Sangwoo: **`/doctor-message#<token>` page is implemented** (branch `fix/backend-frontend-sync`): reads the token from `location.hash`, POSTs `{ token }` to `view-doctor-message` with plain `fetch` (no supabase-js needed), shows `content`, `patient_first_name`, `created_at` and `care_notes.content` (incl. the `normal` list), handles 410 `expired` / 404 / 400 / 429 per contract, and `<meta name="referrer" content="no-referrer">` is set. Verified against the deployed function. Emailed doctor links work once this merges + deploys and `RESEND_API_KEY` is set. `/doctor-entry` is NOT built (no backend function exists yet). Chat still runs on the local demo adapter — binding `chat` remains open.
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: UI revamp PR #13 preserves the patient-only local adapter and adds a local email draft preview using recorded progress. No endpoint, backend schema, env var or port changed; nothing is sent. Read the current live chat/guest contracts and proposed doctor routes. Ranveer still wants frontend work first, so binding, What's normal and warning-sign actions are queued in frontend todo. Public route implementation and email integration remain for the connection pass. Family/admin/doctor-account UI is no longer reachable; old family-access notes below are historical.

- [x] 2026-10-17 · Gold M / Codex for Ranveer: Read backend PR #2 and preserved its changes while preparing our frontend PR. Ranveer requested publication now and deferred backend connection. Frontend has patient/doctor/family care spaces, source-based companion, clinician plan builder, daily checklist and consented handoff; no admin/nurse screens yet. Family grants, private-chat membership and consented handoffs are prototype contracts that need reconciliation with hospital roles and hospital-wide escalations before live integration.
  - ↳ 2026-10-17 · Andrew: Proposing to drop hospital roles and escalations entirely; see `PLAN.md` and the pivot note under Backend → Frontend.

- [x] 2026-10-17 · Gold M / Codex for Ranveer: frontend owns proposed `frontend/` tree, internal view model in `frontend/src/data/types.ts`, fictional adapter in `repository.ts`; no production table/API names assumed. Please confirm branch and contracts before live binding. Contact thread: https://blankpagehackathon.slack.com/archives/C0C9ZF57F9U/p1792247444562409 .
  - ↳ 2026-10-17 · Andrew: Branch: `main` (everything merged). Contracts: `backend_progress.md` → Data model, Edge functions, cheat sheet.
- [x] 2026-10-17 · Gold M / Codex for Ranveer: need Supabase public config, authenticated test identities, schema/RPC/Edge Function/error contracts, source/approval/checklist occurrence states, private document policy, scoped realtime/revocation behavior. No service-role/secret keys in frontend. See `frontend/docs/INTEGRATION.md`.
  - ↳ 2026-10-17 · Andrew: Public config is under Agreed; tables, RLS and supabase-js snippets are in `backend_progress.md`; test identity `alex@demo.example.com` or a guest (see Agreed). No service-role key needed in the frontend. Edge function contracts follow as each one lands.
  - ↳ 2026-10-17 · Andrew: `chat` contract and error codes (400/401/429) are now in `backend_progress.md` → Edge functions. No document storage in the patient-only plan.
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: Ranveer approved Basic = nonclinical updates + explicitly joined chats; Support adds approved checklist/questions/observations/attributed family reports; Full adds shared plans/documents. All private chats require participation, including for doctor/admin; family cannot edit orders/manage grants. Doctor/patient equally manage grants with audit. New spaces do not auto-grant family access.
  - ↳ 2026-10-17 · Andrew: The backend has no family model after the pivot. If you keep family sharing, tell us what it needs and we'll add a table.
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: 28 unit tests and 18 browser flow groups pass locally; backend isolation, realtime and live AI/delivery not verified. All 71 ECC definitions inventoried, relevant bounded tasks used. Please identify every active repository Claude/Codex session and ownership so exact file/commit clearance reaches each one; silence will not authorize a push.
  - ↳ 2026-10-17 · Andrew: Backend sessions are Andrew's and Sharon's; all backend changes go through PRs with the Claude review, so no direct pushes to coordinate.
