# Care companion

Current product direction, October 17, 2026. This supersedes the earlier doctor/patient/family workspace. Ranveer supplied a patient dashboard reference, an Add instructions reference and the Discharge Companion feature spec.

## Patient experience

The patient lands on a dashboard with daily tasks, important provided instructions and elapsed plan time. A persistent care assistant sits beside the dashboard on desktop and below it on mobile. Its full-screen view shares the same conversation and draft. Add instructions is a simple page for a doctor's name/email, exact care text and optional attachments. There are no reachable doctor, family, nurse or admin screens or role switcher.

Implemented browser-local features:

- Daily task reports and correction, two preconfigured dose slots, due/upcoming/missing report states and reminders.
- Daily check-in: fixed pain scale, optional temperature in °C, feeling and free text. One editable entry per local date; personal pain trend after two dates.
- Read-only roadmap estimates with acknowledgment; no clinical clearance or schedule editing.
- Provided-text companion excerpts, progress summaries and explicit unsupported-answer behavior. Prepared local responses; no live LLM.
- Emergency phrase routing, demo call animation, demo 911 acknowledgment and progress-report preview. No real call or email.
- Plain-text progress preview/download based on actual local reports. No fabricated adherence history or healed percentage.
- Local persistence with transactional writes and recoverable failure messages. Emergency UI remains usable if saving fails.

## Scope and truth

Fictional Alex Morgan and Dr. Maya Chen only. Do not enter real patient information. Data stays in the browser; the prototype has no authentication or server-side isolation. Supabase binding, clinician input verification, PDF/OCR extraction, hosted report links and email delivery are deferred. Backend files are owned by Andrew and teammates.

Fixed sample settings and unresolved backend decisions are recorded in [companion instructions](docs/COMPANION-INSTRUCTIONS.md). Uploaded text is stored exactly; adding it does not silently change scheduled tasks or read-only roadmap settings. The future model must follow the same documented grounding and reporting boundaries.

## Design

Use Ranveer's supplied two screen compositions with lighter blue/mint/off-white tokens and rounded Nunito. Flat borders, restrained 5–12px corners, no shadows, gradients, hover animation, pure-white canvas or marketing boilerplate. Short automatic SVG/GSAP intro, reduced-motion bypass, real pending-state skeletons and concise interface transitions.

The former care-space repository and component source remain available for backend reconciliation, but are not rendered or navigable in the patient app. Their existing data tests remain regression checks; current patient tests and browser evidence are listed separately in `docs/VERIFICATION.md`.

The latest presentation brief is5 minutes and fewer than 6 slides; the saved generation prompt mandates exactly 5 slides total with a60-second demo. The slideshow is reported to be 25% of the grade. UI changes now include active desktop navigation, a functional mobile dock, a derived next milestone and an exact-source shortcut; these do not add a live model or change care schedules.
