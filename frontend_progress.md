# Frontend progress

Owned by the frontend side (Ranveer, Marcus). Only frontend sessions edit this file. Backend: read it, but put anything for us in `overlap.md`.

## Current state

- **Stack:** React + TypeScript, Vite, plain token-based CSS, GSAP/useGSAP, Lucide, self-hosted Nunito Variable, Vitest. Isolated under `frontend/`.
- **How to run:** `cd frontend && npm ci && npm run dev -- --port 5188`. Production `npm run build && npm run preview -- --port 5190`.
- **Working locally:** fictional doctor/patient/family role demonstration; five expandable care contexts; participant-scoped conversations; source-based companion excerpts; clinician draft/edit/preview/approve/publish; supported text upload; date-aware checklist/report/correction; approved Basic/Support/Full matrix and access audit; patient-consented doctor handoff and acknowledgement.
- **Data:** browser-local fictional adapter in `frontend/src/data/`. NOT live Supabase auth/security/realtime or LLM. Do not enter real patient data.
- **Validation:** production build, 35 tests (31 data + 4 component), historical 18 browser flow groups, responsive geometry and axe at 1440/1024/768/375 plus conversation dialog, keyboard focus and reduced motion. Details in `frontend/docs/VERIFICATION.md`.
- **In progress:** Backend integration deferred by Ranveer; Marcus ownership confirmation and full active-agent roster/clearance requested in Slack. User explicitly requested immediate branch/PR publication of the existing version. The baseline was published as PR #3 after GitHub CLI authorization. Conflict and Claude review passed; the nonblocking robustness findings and modal focus issue are fixed. The verified visual redesign is being added to the same PR for fresh review. No merge authorization.
- **Known limits:** no live API/RLS/storage/realtime verification, PDF/Word parsing, LLM or remote delivery. Local calendar timezone requires backend agreement. Prototype can be run independently.

### Pages

| Route / screen    | What it does                                                               | Backend endpoints used         | Status                       |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------ | ---------------------------- |
| `/`               | Care contexts, daily checklist, demo role switcher                         | None — fictional local adapter | Implemented/verified locally |
| Care-space dialog | Private/group/companion chats, plans, documents, access, consented handoff | Awaiting Andrew contract       | Implemented/verified locally |
| Clinician builder | Text/template intake, source/timing review, draft preview and publication  | Awaiting Andrew contract       | Implemented/verified locally |

## Session log

### 2026-10-17 · Gold M / Codex PR review fixes

- **Did:** Published non-draft PR #3; initial Claude/conflict checks passed. Kept demo roles per tab, targeted grant updates by family ID, reused fallback-safe IDs, and fixed focus trapping around closed details.
- **Validation:** Production build and 31 tests pass. Chrome confirmed doctor/patient stay separate across a shared checklist update and reload; reverse/forward modal focus wraps between Close and the visible details summary.
- **Next:** Continue design updates through the same PR; reconcile backend contracts before live integration.

### 2026-10-17 · Gold M / Codex publication for Ranveer

- **Did:** Prepared existing frontend snapshot `0937153` for immediate PR publication at Ranveer's explicit request. Merged current `main` (`05e7b37`, backend PR #2) in an isolated clone; no conflicts and both sides' team notes preserved.
- **Next:** Run GitHub Claude/conflict review, resolve actionable findings, continue the separate design pass. Backend binding remains deferred.
- **Notes:** Frontend is still a fictional local demo. Backend roles and escalation visibility differ from the approved family/private-chat prototype; reconcile contracts before integration. No backend policies or app behavior changed during publication.

### 2026-10-17 · Gold M / Codex for Ranveer

- **Did:** built frontend pairs in isolation, applied approved family matrix, inventoried all 71 ECC definitions, used bounded specialist implementation/review and fixed concrete findings.
- **Files:** `frontend/`, frontend section of `todo.md`, Frontend → Backend notes in `overlap.md`, this progress file. Backend files and CLAUDE.md unchanged.
- **Next:** agree Supabase contract and active session roster, request exact-change clearance, push feature branch/open non-draft PR, address Claude review, integrate and audit exact committed GitHub revision when authorized.
- **Notes:** local-demo verification does not establish server privacy. No agent silence is treated as approval.

### 2026-10-17 · Quiet coastal redesign

- Replaced white rounded-card styling with ivory, mineral blue, sage, dark ink, flat rows and 3px corners. Added an immediate entry screen and styled HTML first paint; no artificial delay.
- Selected a licensed film photograph, researched seven Color Hunt palettes and built `/design-study.html` with sources and three image options. Consulted Godly, Transitions.dev, Deck Gallery public previews and NHS type guidance. Animus.app currently redirects to a domain-sale page.
- Preserved fictional local data, all permissions, plan publication, source provenance, checklist reporting and consented handoff. Backend connection still deferred.
- Updated existing browser scripts to enter through the new welcome screen. Verification details are recorded in `frontend/docs/VERIFICATION.md`.

### 2026-10-17 · Lighter palette and opening motion

- Replaced ivory/serif styling with light blue, mint, cool off-white and rounded Nunito Variable. Archived the research board outside public app routes.
- Built a custom SVG/GSAP intro that enters automatically after about one second, with Skip and immediate reduced-motion entry. Added scoped surface/dialog/message transitions and real image/reply skeletons; hover remains static.
- Production build and 35 tests pass. Browser checks cover automatic entry, Skip, keyboard wrapping/Escape/focus return, desktop/mobile overflow and console. Independent source review passed. See current verification section for scope and artifacts.
- Patient-focused larger overhaul awaits Ranveer's reference image/full prompt. Backend connection remains deferred. Publish this finished pass through PR #3 and wait for Claude/conflict review; no merge authorization.
