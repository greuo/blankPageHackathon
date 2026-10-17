# Overlap: frontend ↔ backend

Things one side needs the other to see: API changes, requests, questions, heads-ups.

- Write new notes in the section for your direction, newest at the top.
- Format: `- [ ] YYYY-MM-DD · Name: note`
- The receiving side ticks `[x]` once it's handled and can add an indented reply: `  - ↳ YYYY-MM-DD · Name: reply`. Ticking and replying are the only edits you make to the other side's notes.

## Agreed

Things both sides rely on: API base URL, ports, data shapes, auth, env vars. Either side can add one. To change one, post a note in your direction's section first and wait for a reply.

_Nothing yet._

## Backend → Frontend

_Nothing yet._

## Frontend → Backend

- [ ] 2026-10-17 · Gold M / Codex for Ranveer: frontend owns proposed `frontend/` tree, internal view model in `frontend/src/data/types.ts`, fictional adapter in `repository.ts`; no production table/API names assumed. Please confirm branch and contracts before live binding. Contact thread: https://blankpagehackathon.slack.com/archives/C0C9ZF57F9U/p1792247444562409 .
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: need Supabase public config, authenticated test identities, schema/RPC/Edge Function/error contracts, source/approval/checklist occurrence states, private document policy, scoped realtime/revocation behavior. No service-role/secret keys in frontend. See `frontend/docs/INTEGRATION.md`.
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: Ranveer approved Basic = nonclinical updates + explicitly joined chats; Support adds approved checklist/questions/observations/attributed family reports; Full adds shared plans/documents. All private chats require participation, including for doctor/admin; family cannot edit orders/manage grants. Doctor/patient equally manage grants with audit. New spaces do not auto-grant family access.
- [ ] 2026-10-17 · Gold M / Codex for Ranveer: 28 unit tests and 18 browser flow groups pass locally; backend isolation, realtime and live AI/delivery not verified. All 71 ECC definitions inventoried, relevant bounded tasks used. Please identify every active repository Claude/Codex session and ownership so exact file/commit clearance reaches each one; silence will not authorize a push.
