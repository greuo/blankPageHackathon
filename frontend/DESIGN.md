# Care companion design

Current direction: a light patient recovery workspace with sage and leaf-green regions, rounded Nunito typography and flat surfaces. Ranveer's two original desktop compositions define the product structure. His newer healthcare mobile references inform hierarchy, navigation and grouping. They are inspiration rather than a booking/doctor-directory feature request.

## Tokens and typography

| Token | Value | Role |
| --- | --- | --- |
| Canvas | `#F2F6EF` | Light sage page |
| Surface | `#FAFCF7` | Green-tinted task rows, forms and dialogs |
| Sage | `#E4EEDC` | Navigation and soft icon surfaces |
| Mint | `#DCEBD8` | Support and confirmation |
| Panel | `#E8F0E2` | Guidance and source text |
| Strong panel | `#DFEBD6` | Greeting, assistant header and timeline |
| Action | `#286642` | Primary actions and focus |
| Green | `#326F4D` | Add instructions and reported state |
| Ink | `#203E2F` | Text and icons |
| Muted | `#536A58` | Supporting copy |
| Line | `#CBDAC4` | Structural dividers |
| Strong line | `#788E70` | Control boundaries |
| Urgency | `#123B22` | Deep-green urgent and destructive actions |
| Urgent surface | `#163D28` | Inverse emergency panel, distinct from pale routine surfaces |
| Urgent text | `#F0F6E7` | High-contrast emergency copy and filled primary control |

The October 17 green-only request supersedes the earlier blue/mint palette. Shared color roles live in `src/styles.css`; the patient UI inherits them. Pale sage and leaf tints provide separation, with forest text and actions. Emergency guidance uses a dark inverse panel, light text, a filled primary action and an outlined secondary action. Its words and phone icon remain explicit. Destructive controls use the deepest green, heavier type and a stronger border. Notification markers use a diamond shape. First-paint HTML and the favicon use matching values. Palette names and design-process text stay out of the app.

One self-hosted Latin **Nunito Variable** WOFF2 asset supplies the interface. Main headings use 800; controls 700–750; body 400. Desktop greeting is 32–41px according to breakpoint; mobile is 30px. Sections are 21–24px; task titles 17–18px; editable fields and most care text stay 15–16px. Headings balance short lines, care text wraps naturally and numeric progress uses tabular figures. Font license is distributed at `public/fonts/Nunito-LICENSE.txt`.

## Layout and shape

Desktop uses an 82px horizontal header, a 1440px maximum page and two working columns with a 28px gap. Home, My instructions and Progress connect to real existing flows. The sage greeting includes the actual local date and Add action. To-Do remains the exact requested heading; freestanding rows show titles and patient report state without secondary descriptions. Provided guidance uses a light sage region. A leaf-green timeline shows elapsed plan time and the next actual milestone. It never claims healing percentage.

The assistant has a sage header, quiet transcript, exact-instructions shortcut, report control and a stable composer. Its message log scrolls independently and preserves older-message reading position. Expanded mode fills the viewport with narrow gutters and one title. Native dialog focus containment, Escape, explicit close and return focus remain.

Below 850px the dashboard stacks and a fixed Home/My plan/Companion dock connects to existing navigation. Space is reserved below content and focus targets have a bottom scroll margin. At 390px, task icons recede to preserve text width; native checkboxes and action labels remain clear. The assistant becomes an in-page panel and can expand to a nearly full viewport.

Add instructions is a centered page up to 1060px wide. Doctor name/email are paired on desktop and stack on mobile. Source wording, attachments and Cancel/Save follow one clear vertical sequence. Source, check-in, pill, roadmap, report and urgent dialogs use the same form vocabulary.

Corners range from 5–12px according to control and surface scale. Structure comes from spacing, tinted regions and single borders. Icons use the existing Lucide library. No clinician portraits or generated product screenshots are introduced.

## Motion and state

The initial HTML and React opening share the final canvas, title and centered geometric mark. A scoped GSAP line/wordmark sequence enters automatically after about 1.06 seconds. Skip enters immediately; reduced motion bypasses the timed sequence. Session storage remembers entry, and a demo control can replay it. Focus enters main afterward.

Interface transitions communicate state with short enter/exit motion, including 140ms dialog exit. GSAP contexts clean up and empty selectors return before starting animation. Default content remains readable. Hover stays static. Real pending images/replies have skeleton feedback; no artificial loading wait is added. Reduced-motion CSS/JS guards remove motion. No 50ms paint or frame-rate guarantee is claimed.

Keep empty, pending, saved and failed states explicit. Errors appear inside their active dialog. Emergency help opens even if persistence fails. Check-in emergency detection occurs on submission, with the interrupted draft restored on return.

## Product truth and exclusions

Patient-only fictional browser-local prototype. No reachable doctor/family/admin screen. Clinician verification, live model, document extraction, email delivery and hosted report links remain deferred. The companion quotes provided text and reports recorded entries. Adding text does not silently change the prepared dose schedule or read-only roadmap.

No gradients, shadows, pure-white canvas, hover movement, rainbow/neon category colors, glass, sparkle decorations, colored left stripes, three-feature-card rows, fake testimonials, pricing or legal-footer clutter. Medical urgency remains distinct from routine guidance. No contrast slogans or palette commentary appear in product copy.
