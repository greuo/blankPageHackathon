# Frontend progress

Owned by the frontend side (Ranveer, Marcus). Only frontend sessions edit this file. Backend: read it, but put anything for us in `overlap.md`.

## Current state

- **Stack:** React + TypeScript, Vite, plain token-based CSS, GSAP/useGSAP, Lucide, self-hosted DM Sans/Manrope, Vitest. Isolated under `frontend/`.
- **How to run:** `cd frontend && npm ci && npm run dev -- --port 5188`. Production `npm run build && npm run preview -- --port 5190`.
- **Working locally:** fictional doctor/patient/family role demonstration; five expandable care contexts; participant-scoped conversations; source-based companion excerpts; clinician draft/edit/preview/approve/publish; supported text upload; date-aware checklist/report/correction; approved Basic/Support/Full matrix and access audit; patient-consented doctor handoff and acknowledgement.
- **Data:** browser-local fictional adapter in `frontend/src/data/`. NOT live Supabase auth/security/realtime or LLM. Do not enter real patient data.
- **Validation:** production build, 28 data tests, 18 browser flow groups, responsive geometry and axe at 1440/1024/768/375 plus conversation dialog, keyboard focus and reduced motion. Details in `frontend/docs/VERIFICATION.md`.
- **In progress:** Backend integration deferred by Ranveer. On 2026-10-17 he explicitly requested immediate publication through a PR for Claude/conflict review. Publishing the tested frontend snapshot separately from the ongoing design pass; no merge authorization.
- **Known limits:** no live API/RLS/storage/realtime verification, PDF/Word parsing, LLM or remote delivery. Local calendar timezone requires backend agreement. Prototype can be run independently.

### Pages

| Route / screen | What it does | Backend endpoints used | Status |
| --- | --- | --- | --- |
| `/` | Care contexts, daily checklist, demo role switcher | None — fictional local adapter | Implemented/verified locally |
| Care-space dialog | Private/group/companion chats, plans, documents, access, consented handoff | Awaiting Andrew contract | Implemented/verified locally |
| Clinician builder | Text/template intake, source/timing review, draft preview and publication | Awaiting Andrew contract | Implemented/verified locally |

## Session log

### 2026-10-17 · Gold M / Codex publication for Ranveer
- **Did:** Prepared existing frontend snapshot `0937153` for immediate PR publication at Ranveer's explicit request. Merged current `main` (`05e7b37`, backend PR #2) in an isolated clone; no conflicts and both sides' team notes preserved.
- **Next:** Run GitHub Claude/conflict review, resolve actionable findings, continue the separate design pass. Backend binding remains deferred.
- **Notes:** Frontend is still a fictional local demo. Backend roles and escalation visibility differ from the approved family/private-chat prototype; reconcile contracts before integration. No backend policies or app behavior changed during publication.

### 2026-10-17 · Gold M / Codex for Ranveer
- **Did:** built frontend pairs in isolation, applied approved family matrix, inventoried all 71 ECC definitions, used bounded specialist implementation/review and fixed concrete findings.
- **Files:** `frontend/`, frontend section of `todo.md`, Frontend → Backend notes in `overlap.md`, this progress file. Backend files and CLAUDE.md unchanged.
- **Next:** agree Supabase contract and active session roster, request exact-change clearance, push feature branch/open non-draft PR, address Claude review, integrate and audit exact committed GitHub revision when authorized.
- **Notes:** local-demo verification does not establish server privacy. No agent silence is treated as approval.
