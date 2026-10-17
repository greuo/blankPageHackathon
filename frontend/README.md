# Care companion frontend

Patient-only React/TypeScript prototype based on Ranveer's selected dashboard and Add instructions references. Fictional browser-local data; no doctor/family/admin workspace is reachable.

## Run

Requires Node >=22.12 (verified on 22.23.2). From repository root:

```sh
npm --prefix frontend ci
npm --prefix frontend run dev -- --port 5188
```

Production preview: `npm --prefix frontend run build`, then `npm --prefix frontend run preview -- --port 5190`. Tests: `npm --prefix frontend test`.

## Try the patient flow

1. The short opening animation enters automatically; Skip is available.
2. Add instructions: doctor's name/email, exact text, optional TXT/PDF/images. Save and inspect View all. File text extraction is deferred; paste care wording into the text field.
3. Report a task, complete the check-in and record a due dose. Reload to confirm local persistence. Check-ins on multiple dates produce a personal trend.
4. Talk to the prepared-response companion. Expand to full screen; the draft and conversation persist across views.
5. Open the read-only roadmap, acknowledge a milestone and inspect reminders.
6. Open Progress report and download the TXT. Email delivery and hosted doctor links remain deferred.
7. Demo controls can advance the clock, replay the opening or reset sample data. Emergency wording opens help; the call animation never dials, and the email preview never sends.

## Boundaries and evidence

Do not enter real patient details. Current storage is localStorage with no authentication, backend privacy enforcement or live LLM. The dose and milestone settings are preconfigured sample data; imported text does not silently rewrite schedules. Timeline percentage is elapsed planned time. Reports describe patient entries and do not establish ingestion or healing.

See [product](PRODUCT.md), [design](DESIGN.md), [companion instructions and future email contract](docs/COMPANION-INSTRUCTIONS.md), [verification](docs/VERIFICATION.md), and [complete skill applicability audit](docs/SKILL-APPLICATION.md).

The former shared-care components/repository and their 31 data tests remain as reference for backend reconciliation; they are not rendered by the patient app. Scripts under `scripts/` target that historical UI and should not be used as evidence for the current patient screens.
