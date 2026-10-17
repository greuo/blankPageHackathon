# Verification evidence — 2026-10-17

## Environment and scope

Node 22.23.2; npm 10.9.8; real browser Chromium 155.0.8059.82. Production Vite build served locally at http://127.0.0.1:5190. Fictional local-browser adapter only. Repository base inspected: e659ed05666b06dad6dab9f416e76ad858c11339. Exact final local commit is recorded in the external push manifest and continuity checkpoint after committing.

## Completed checks

- `npm run build`: TypeScript and optimized production build passed.
- `npm test`: 28 meaningful data tests passed: clinician publication and immutable versions, sourced instructions, independent chat membership, family matrix/revocation, cross-space selectors, attributed/idempotent reports/corrections, stale draft version rules, historical plan selection, daily end-time boundaries/DST, patient consented handoffs, exact approved excerpts, UTF-8/size intake, corrupt/unavailable storage and storage events.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities at time checked.
- Production browser flow script: eight groups passed — checklist save/correct/re-report/reload; approved source citation; uncovered question with editable consented handoff; doctor acknowledgement; family exclusion from doctor/patient private chat and handoff; attributed family report; Basic/Support/Full shared plan/document/checklist differences; patient grant authority/revocation.
- Builder browser script: five groups passed — space creation/upload/rejected PDF/draft isolation/explicit approval; published patient checklist; care-space-scoped document; injected storage-save failure preserving text and duplicate-safe retry; Escape dialog behavior.
- Additional production-browser checks: two concurrency groups passed (unseen changed draft cannot publish; stale draft preserves content in next version with fresh approval) and three feature groups passed (unavailable/usage-limit states with preserved question and consented fallback; unrestricted selected-participant group creation; incoming updates preserve older-message scroll). Axe also reported zero findings in the unavailable/limit states.
- Responsive geometry at 1440, 1024, 768 and 375px: no document horizontal overflow. Conversation dialog also fits at 375px; horizontal tab navigation intentionally scrolls within its own container.
- Axe WCAG 2 A/AA, WCAG 2.1 AA and best-practice scans: zero findings across those four homepage widths and the mobile conversation dialog, after fixing unique landmark labels.
- Keyboard: 18 consecutive Tab presses remained inside dialog after explicit focus-wrap fix; Escape closes it. Native form controls are keyboard operable.
- Reduced-motion emulation: pressed state stays true, check visible, accent strokes remain hidden; ordinary completion timeline also exercised. GSAP cleanup is scoped through useGSAP. No profiler/frame-rate guarantee is claimed.
- Final production-browser console check: zero errors and zero warnings.
- Impeccable detector: initial source quote border finding fixed; second run returned an empty finding list.

Scripts under `frontend/scripts/` are reusable Playwright CLI function expressions. Run from repository root with a browser session at the prototype; run `browser-check.js`, `builder-browser-check.js`, then `accessibility-browser-check.js`. They reset fictional data. Screenshots are local ignored artifacts under `frontend/output/playwright/`.

## Review corrections

ECC-informed specialist review found and corrected implicit family access for new spaces, revised instructions inheriting old completion identity, historical checklist version replacement, hidden daily end-date fields, title limit mismatch, unseen concurrent-draft publication, exact daily end-time bounds, future restriction labeling, and stale draft reopening. Browser verification caught GSAP pending-state timing and focus wrapping. Definitions consulted are documented in ECC-INVENTORY.md; these are bounded real tasks, not 71 running agents.

## Unavailable checks / integration blockers

Backend integration is explicitly deferred by Ranveer. Andrew's Supabase schema/auth/API/storage/realtime contract is not present in inspected GitHub branches or team docs and has been requested in Slack. No Supabase backend, migration, storage/RLS policy, Edge Function, live AI or remote handoff is integrated or certified. UI role tests establish demo behavior only; all demo storage is readable in devtools. Independent authenticated sessions, direct-API isolation, private attachments/search/notifications/realtime revocation, actual live AI limits/failures and external delivery still need backend integration and runtime testing.

At the original local-only checkpoint, no push or PR was claimed. Ranveer subsequently explicitly requested publication: PR #3 is open with initial Claude/conflict checks passed. The design and review follow-ups below require checks against their new immutable GitHub revision. No merge or hosting deployment is claimed.

## Quiet coastal redesign · 2026-10-17

This section describes the quiet coastal visual revision added after the original frontend snapshot in PR #3.

- Production build and all 28 repository tests pass after the visual/focus changes.
- Real in-app-browser inspection at 1280×720 and a narrow 304px viewport: opening screen, workspace, patient conversation, clinician care-space details and builder. Search filters correctly; doctor/patient switching remains usable; a companion question returns the expected attributed approved-source excerpt.
- Read-only browser checks found no page overflow and no failing text contrast in the inspected opening, workspace, conversation, unavailable state and builder. This is a targeted computed-style check, not a new full axe audit. The full axe results above belong to the earlier frontend revision.
- Found and fixed a real keyboard boundary issue: Chromium retained layout rectangles for the select inside closed `details`. The focus trap now excludes closed-details descendants except the visible summary. Verified Shift+Tab from Close lands on the summary, Tab from summary returns to Close, and Escape dismisses. Earlier background-tab native-key simulation was inconclusive; final confirmation used locator-targeted keyboard input.
- Narrow clinician details now give the description a full text column and place the build action below it. The conversation composer is visible within a 720px-tall desktop dialog; long content remains scrollable.
- Impeccable detector flagged cream and oversized italic display in the initial pass. Removed the italic display. Ivory is a deliberate brief-derived palette decision. Independent read-only review identified a lost unavailable-state style; restored its padding/grouping and confirmed the final disposition **Pass**. No further cosmetic revision recommended.
- Source audit: no gradients, hover animations, drop shadows, pure-white backgrounds, sparkle icon, colored-left-stripe decorations, rainbow category surfaces or three-card care-context grid. Decorative checkbox strokes removed. Reduced-motion branch remains intact and no new entrance animation was added.
- First paint includes inline styled HTML with a preloaded local photograph, readable fallback type and the final canvas. No artificial 100ms wait. A 50ms end-to-end paint time is not established or guaranteed.

Current screenshot evidence, ignored from Git: `output/playwright/quiet-opening-desktop.png`, `quiet-opening-mobile.png`, `quiet-workspace-desktop.png`, `quiet-workspace-mobile.png`, `quiet-unavailable.png`, `quiet-builder-desktop.png`, `quiet-clinician-mobile.png`.

Research deliverables: `public/design-study.html`, `docs/DESIGN-RESEARCH.md`, updated `DESIGN.md`, seven linked Color Hunt palettes and three licensed photographic options. The working prototype remains fictional and browser-local; backend integration is deferred.

## PR #3 follow-up verification

- Production build and 31 data tests pass after the nonblocking Claude review fixes.
- Regression tests cover independent per-tab actor sessions with shared care updates, selecting one of two family grants, and request IDs without secure-context crypto.
- Chrome at isolated preview port 5191: doctor and patient remained separate after a shared checklist report; doctor role survived reload. Modal Shift+Tab from Close reached the closed details summary; Tab returned to Close, skipping its hidden select.
- Initial PR #3 Claude review and deterministic conflict check passed. Backend role/model reconciliation remains deferred and is explicitly not live integration.

## Lighter palette, Nunito and automatic intro · October 17, 2026

- Production build and 35 tests pass: 31 data tests plus four component lifecycle tests using real GSAP. New tests exercise StrictMode automatic completion once, skip/cancel, reduced-motion immediate entry and image skeleton removal on load.
- Real in-app browser: automatic entry focuses main; replay/Skip works; desktop 1280px and mobile 375px have no document horizontal overflow. The mobile dialog measures 359px within the viewport. Modal Shift+Tab reaches the visible details summary, Tab returns to Close, Escape animates dismissal and restores focus to the opening care-space button.
- Console check returned zero warnings/errors. Earlier targeted computed-style checks found no failing text contrast after avatar foreground correction. This pass does not claim a new full axe audit or rerun of all historical browser flow scripts.
- Independent read-only source review passed lifecycle/cleanup/accessibility checks. Its screenshot review identified cropped, mid-animation evidence; replaced with settled full-page captures: `output/playwright/light-workspace-settled.jpg` (1265×2065 content) and `light-workspace-mobile.jpg` (360×3215 content). Viewport overrides were reset after responsive validation.
- Nunito is one self-hosted Latin variable font asset (39.12KB); production CSS is 32.97KB and JS 373.19KB before gzip. Skeletons reflect actual pending work. Reduced-motion behavior is covered by component tests and CSS/JS guards; no frame-rate or 50ms paint guarantee is claimed.
- Historical palette board moved from public routing to `docs/archive-design-study.html`; app surfaces contain product content only. Backend integration remains deferred.

## Patient-only reference overhaul · October 17, 2026

- Production build and 48 tests passed: 31 legacy data regressions, four opening/image lifecycle tests, eight patient-model tests, three patient persistence tests and two patient UI storage-failure tests.
- Independent bounded review found and fixed three P2 issues: emergency UI suppressed by a failed write, draft loss on chat expansion, and modal errors behind the modal. Reviewer rechecked those fixes, then applied installed ECC React/TypeScript source guidance and independently passed TypeScript checking. Named ECC dispatch was unavailable despite metadata listing the roles; no claim that separate named runtime agents executed. No ESLint/react-hooks configuration is present; manual lifecycle review and TypeScript/tests were used.
- In-app-browser testing: automatic intro, shared full-screen draft, source-preserving Add instructions save, daily pain/temperature/feeling/notes save, reported dose, summary values and TXT download, emergency phrase routing, no-call animation, acknowledgment and reload persistence.
- The browser found a legacy `main#main` grid collision. Scoped it to the legacy `.main-shell`; corrected dashboard now spans the viewport. Chat arrival initially scrolled the entire document; scoped auto-scroll to the message log and preserved older-message reading position.
- Email, model inference, text extraction, secure doctor-link hosting, backend privacy enforcement and clinician-authored configuration have not been connected or verified. Earlier legacy browser scripts target the former workspace and are historical; they are not current patient UI verification.

Final patient-pass browser confirmation: desktop 1536px dashboard spans 1457px with a 478px companion and no overflow; mobile 375px dashboard/intake has no overflow or targeted text-contrast findings; full-screen mobile dialog is 359px wide. Shift+Tab reaches the composer, Tab wraps to Close and Escape dismisses. TXT attachment intake/save and progress TXT download were exercised. Empty-target GSAP warnings observed on intake navigation were corrected by guarding empty selector results before animation. Current-build console results are recorded in the final checkpoint.

## PR #7 review correction

Claude's first review requested a change for symptom negation and check-in interruption. Emergency checks now run on submitted notes, with a basic literal negation guard; affirmative emergencies still open help even before other check-in answers are complete. Closing help restores the interrupted check-in values. Browser verified “No chest pain” saves normally, typing “I cannot breathe” leaves the form intact until submission, and the same draft returns after emergency dismissal. Nine patient-model tests now cover common negative and mixed-positive wording; total is 49 tests, all passing, with a successful production build. This remains a conservative demo trigger, not clinical triage.

Removed emergency-email preview to align with the newer patient-only team plan; report preview/download remains separate. Demo preview events carry an explicit exercise label in exported reports. Retained Nunito's complete upstream SIL font license as a public distribution asset. Legacy source is already documented as unused reference code. Clinician input/model schema binding remains deferred to the patient migration contract.
