# Frontend progress

Owned by the frontend side (Ranveer, Marcus). Only frontend sessions edit this file. Backend: read it, but put anything for us in `overlap.md`.

## Current state

- **Stack:** React + TypeScript, Vite, semantic token CSS, Google Sans / Funnel Display / EB Garamond variable fonts, GSAP/useGSAP, Motion for React, Lucide, Vitest. Isolated under `frontend/`; fonts self-hosted with complete OFL licenses.
- **Run:** `npm --prefix frontend run dev -- --port 5188`; `npm --prefix frontend run build`; production preview on 5190; `npm --prefix frontend test`.
- **Current UI:** Patient-only cobalt/sky/navy dashboard and Add instructions page; title-only To-Do rows without trailing arrows; daily task/dose reporting; check-in/trend; read-only roadmap; reminders; demo emergency/call flow; original progress report and TXT download. No reachable doctor/family/admin account screens.
- **New React Bits:** SpringCheck for To-Do, RubberSegment navigation, JellyRadio check-in, SwipeToast saves and CountUp timeline. GSAP click feedback throughout enabled controls, with an optional remembered soft click sound. Five exact upstream prompts plus app-specific instructions under `frontend/docs/REACT-BITS-ANIMATION-PROMPTS.md`.
- **Companion and motion:** Embedded/full-screen assistant with shared draft, PromptBar shortcuts, send/stop control and focus/hover tooltips. 1.8-second LightTunnel/GSAP opening with Skip, static fallback and reduced-motion bypass. SquishSwitch and StatusMark demonstrate an optional-instructions email draft preview. Skeletons reflect actual pending work.
- **Data:** Typed browser-local patient adapter in `frontend/src/patient/`, fictional records only. Existing information and source wording preserved. Legacy shared-care modules remain reference source and regression tests. Local assistant remains deterministic.
- **Validation:** Latest production build and 75 tests pass; independent ECC-informed React/TypeScript review approved after fixing fullscreen header contrast. Current browser checks cover 390/768/1440px, keyboard task/radio/save controls, swipe dismissal, sound preference, intake, fullscreen chat, report preview and splash replay. Browser error/warning logs clean. Vite retains a 519 KB JS chunk advisory. Details: `frontend/docs/VERIFICATION.md`.
- **Integration next:** Andrew's documented Supabase patient-only tables, guest auth and live `chat` contract are available. Frontend binding is still deferred at Ranveer's request. Live inference, doctor input verification, extraction, email delivery and secure doctor links are not connected in this UI. No live privacy/security claim.
- **Delivery:** Current revamp is PR #13 on `codex/patient-ui-motion`; initial Claude/conflict checks approved. Latest main documentation was merged cleanly and frontend handoff notes added to the same PR. Final exact revision/check status is recorded in the local continuity checkpoint. No merge performed.

## Session log

### 2026-10-17 · Blue palette and five React Bits interactions / Gold M for Ranveer

- **Did:** Replaced the green palette with cobalt, sky and navy; pill primary actions, circular icon controls, rounded panels/forms; navy assistant header including fullscreen. Preserved all existing patient information and behaviors.
- **Motion:** Integrated five actual React Bits adaptations with source prompts/attribution. Added scoped GSAP press feedback and a persistent sound toggle; trusted gestures only, no autoplay. Earlier PromptBar, SquishSwitch, StatusMark and LightTunnel remain integrated.
- **Validation:** Build + 75 tests pass. Real-browser keyboard, save/swipe, mobile, fullscreen draft, local report and opening checks pass. Independent review approved after a fullscreen contrast fix. Current browser viewport bottoms out at 390px; 320px was requested but not verified as a true 320px layout in this pass.
- **Delivery:** Update existing PR #13, leave merge/review gates intact. No backend/API changes; binding is still deferred. Exact latest check status is in the local checkpoint.

### 2026-10-17 · To-Do arrow removal / Gold M for Ranveer

- Removed the trailing arrow from each To-Do row; task buttons and reporting behavior remain available.
- Production build passed; browser confirmed three task rows and zero row arrows. Narrow source review approved. Published through the existing PR #13.

### 2026-10-17 · React Bits patient UI revamp / Gold M for Ranveer

- **Did:** Refined all green surfaces, continuous To-Do list and typography; added adapted PromptBar, tooltip, SquishSwitch, StatusMark and bounded LightTunnel components. Kept existing patient information, reports and flows. Added truthful local email draft preview without sending.
- **References/tools:** Browsed/scrolled React Bits, Color Hunt and public Mobbin. Installed/authenticated official 21st CLI, retrieved a tooltip reference and ran its local review. Stitch workspace did not load; no generated output claimed. Applied relevant design/memory/ECC skills and documented adaptations.
- **Validation:** Build + 62 tests pass; responsive and keyboard checks completed; source review approved. Claude's initial PR #13 verdict was looks good/no conflicts. Its aria-disabled visual suggestion is already covered by ReportDraft.css. Bundle advisory retained transparently.
- **Coordination:** Incorporated PR #12's handoff docs without changing backend code. Read current backend notes; added integration follow-ups to frontend todo. Current email preview does not implement notify-doctor or the proposed public routes.
- **Next:** Connect the patient adapter to the documented backend when that work resumes; agree the two public routes, structured What's normal field and warning-sign action behavior before live integration. Continue through PR review; no merge authorization.


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
