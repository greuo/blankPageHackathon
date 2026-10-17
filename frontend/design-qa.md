# Patient reference implementation QA

Date: October 17, 2026. Mode: Operate. **final result: passed**

## Targets and evidence

Source: Ranveer's two selected 1536×1024 images, supplied as `codex-clipboard-a8c4e3da-a5c8-401e-b513-86d7ac4e2198.png` (dashboard) and `codex-clipboard-14081b46-d1f5-4e9d-b9eb-3a7c3fe19d02.png` (intake). Both opened and inspected. Current implementation: production Vite preview, http://127.0.0.1:5190/.

Compared source and rendered images in the same review input. CSS viewport 1536×1024 for desktop; backend full-page capture returns 1521px content width excluding the 15px scrollbar. Full-page dashboard is taller than source because the implementation adds the functional check-in/report area and explicit demo controls. Compared matching dashboard content rather than treating capture height as drift. Source static greeting/sample medical text differs intentionally from the current clock and provided-text records.

Current evidence, ignored local artifacts under `frontend/output/playwright/`:

- `patient-dashboard-desktop.jpg`: complete header, roughly two-thirds task/instructions/timeline region and one-third sticky companion.
- `patient-instructions-desktop.jpg`: centered intake, name/email pair, source text, attachment target, Cancel/Save.
- `patient-dashboard-mobile.jpg`, `patient-instructions-mobile.jpg`: 375px CSS viewport, single-column reflow.
- `patient-assistant-mobile.jpg`: full-screen modal, usable composer and internally scrolling transcript.

## Five fidelity surfaces

- **Type:** self-hosted rounded Nunito, as directly selected by Ranveer; strong task/headline hierarchy and readable input/body copy. This deliberately replaces the source mock's font.
- **Layout:** the selected screen structure is preserved, including top Home header, patient greeting, Add action, daily task rows, important guidance, time bar and right-hand chat. Form structure matches the second image. Scoped the legacy overview grid so it cannot squeeze the new dashboard. Form fields align at the top.
- **Color:** lighter blue/mint/cool off-white from the confirmed tokens. No pure-white canvas, shadows, gradients or hover motion. Reference shadows and highly rounded pills were excluded under explicit prior instructions.
- **Images/icons:** no photographic region exists in either selected screen. Existing consistent Lucide icons represent tasks, bot, upload and navigation. No raster placeholders or fake testimonials.
- **Copy/content:** care text comes from saved input; percentage labels elapsed plan time. Current sample name is Alex. Model/email/extraction limits are explicit without design-process text in product UI. No contrast slogans added.

## Interaction and accessibility

Browser-verified Add/save exact wording, attachment intake/save, shared draft on full-screen expansion, prepared progress reply, check-in save, dose reporting, factual TXT export, emergency phrase routing, call animation without dialing, acknowledgment and reload persistence. Mobile dashboard/intake/full-screen have no horizontal overflow. Targeted computed-style text contrast scan returned zero findings on mobile dashboard and intake. Keyboard Shift+Tab in full-screen reaches its last enabled composer field; Tab returns to Close; Escape dismisses. Reduced-motion intro is covered by lifecycle tests and source guards. These checks are not a full clinical, screen-reader, axe or backend security certification.

## Corrections and remaining limits

Fixed the legacy main-grid collision, document-scrolling chat arrival, fullscreen draft loss, storage-dependent emergency visibility and errors hidden behind dialogs. Final source review found no remaining blocker. Empty-target GSAP transitions now return before starting a timeline.

No P0/P1/P2 visual or interaction finding remains in the checked states. Live LLM, document extraction, medical schedule configuration, email delivery and hosted secure report links remain deferred product integration work, with a frontend preview rather than false success states.
