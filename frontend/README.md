# Discharge Companion frontend

A clinician creates a personalized recovery companion; the patient and authorized family use approved guidance, conversations and daily reports. All sample people/instructions are fictional.

## Run
Requires Node >=22.12 (verified on 22.23.2).

```sh
cd frontend
npm ci
npm run dev -- --port 5188
```

Open http://127.0.0.1:5188. Port 5188 avoids another local service already using 5173. Production: `npm run build`, then `npm run preview -- --port 5190`. Unit checks: `npm test`.

## Demo sequence
1. Start as Patient to explore five care contexts for Jamie Morgan and a time-aware checklist.
2. Switch the explicitly labeled demo role to Doctor. Create a space; open Build care plan.
3. Paste one line of fictional source wording or upload a UTF-8 .txt (up to 1 MiB). Create line drafts, review wording/source/timing, save draft, preview, explicitly approve and publish.
4. Switch to Patient; find the new approved checklist action, report completion, correct it and reload to demonstrate persistence.
5. Ask the companion about the journal source, then ask an uncovered question. Review/edit the handoff, approve sharing; switch Doctor and acknowledge the local request.
6. Change family Basic/Support/Full and revoke/restore; switch Family to see the differences. Private chats remain participant-only at every level.
7. Reset fictional demo from the footer to restore the initial examples.

## Status and boundaries
Backend connection is deferred by Ranveer. This is a browser-local prototype, not a live Supabase integration. LocalStorage stores the entire fictional dataset. Role switching and operation checks model flows, not authentication or server authorization. No live LLM, remote delivery, multi-user realtime, PDF/Word extraction, or medical treatment is provided. Do not enter real patient information.

See [integration contract and approved matrix](docs/INTEGRATION.md), [verification evidence](docs/VERIFICATION.md), [ECC inventory](docs/ECC-INVENTORY.md), [product context](PRODUCT.md), and [design system](DESIGN.md).

Browser scripts in `scripts/` are async Playwright CLI functions; run with an existing browser session at this URL using `playwright-cli -s=discharge run-code --filename scripts/browser-check.js`, then `builder-browser-check.js`, `concurrent-draft-browser-check.js`, `feature-browser-check.js`, and `accessibility-browser-check.js`. They reset fictional browser data. Browser tooling is not required to run the prototype.
