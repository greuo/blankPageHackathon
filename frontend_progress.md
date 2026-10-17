# Frontend progress

Owned by the frontend side (Ranveer, Marcus). Only frontend sessions edit this file. Backend: read it, but put anything for us in `overlap.md`.

## Current state

- **Stack:** React + TypeScript, Vite, token CSS, Nunito Variable, GSAP/useGSAP, Lucide, Vitest. Isolated under `frontend/`.
- **Run:** `npm --prefix frontend run dev -- --port 5188`; production build/preview on 5190.
- **Current UI:** Patient-only dashboard and Add instructions page, embedded/full-screen companion, daily task/dose reporting, check-in/trend, read-only roadmap, reminders, demo emergency/call flow and progress preview and downloadable progress text. No reachable doctor/family/admin screen or role switcher.
- **Data:** New typed browser-local patient adapter under `frontend/src/patient/`. Fictional data only. Legacy shared-care modules remain reference source and regression tests.
- **Validation:** Build and 49 tests pass, bounded ECC-informed React/TypeScript source review, desktop/mobile browser flows. See `frontend/docs/VERIFICATION.md` for current versus historical checks.
- **Deferred:** Andrew's backend, clinician input verification, real LLM, document extraction, email delivery and secure report links. No live privacy/security claim.
- **Delivery:** PR #3 was merged on GitHub while this revision was in progress. This patient-only follow-up goes through a new PR and Claude/conflict checks. No merge authorization. Latest immutable head/check status is recorded in the local continuity checkpoint after publication.

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
- Patient-focused larger overhaul awaits Ranveer's reference image/full prompt. Backend connection remains deferred. The light-palette pass was pushed as 1d43b47. PR #3 has since been merged; the combined patient follow-up needs a new PR and Claude/conflict review. No merge authorization.

### 2026-10-17 · Patient-only reference overhaul

- Built the two selected screen compositions with light blue/mint/off-white and Nunito; removed role/clinician/family navigation from the rendered app.
- Implemented the four patient feature areas locally, full-screen draft continuity, exact-source intake, factual TXT report and companion behavior contract. Real email/link/backend integration stays deferred.
- Audited 282 local skill entrypoints and all 71 ECC role definitions; recorded applicability and actual-use limits in `frontend/docs/SKILL-APPLICATION.md`.
- Fixed review findings and browser-discovered legacy layout and chat scroll collisions. Build48tests pass; desktop/mobile and interaction evidence in the verification document.

### 2026-10-17 · UI revamp and slideshow prompt

- Strengthened blue/mint regions, removed nested To-Do framing, added actual date/next milestone, mobile navigation dock and viewport-sized companion. Kept patient-only scope, exact To-Do label, Nunito and prior visual restrictions.
- Added a subagent-authored detailed slideshow prompt: exactly 5 slides/5 minutes including60-second demo, four speakers, META story, authentic screenshots, truth boundaries, notes/fallback/Q&A. Prompt files under frontend/docs.
- Build and 49 tests pass, new navigation/shortcut and mobile fullscreen/focus verified, targeted contrast/overflow clean. Fresh source/visual review had no actionable findings. Same PR8 will be updated if still open; no merge authorization.
