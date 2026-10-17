# Care companion design

Current direction: a brighter patient workspace with cobalt actions, sky surfaces and deep navy text. The latest request replaces the previous green-only direction and calls for softer shapes and responsive, playful interaction. Preserve all patient information and the existing patient-only workflows.

## Color and type

| Token           | Value     | Use                            |
| --------------- | --------- | ------------------------------ |
| Canvas          | `#EEF3FA` | Page and first paint           |
| Surface         | `#F7F9FD` | Forms, rows and dialogs        |
| Ink / navy      | `#14284B` | Main text, assistant header    |
| Muted           | `#506384` | Supporting text                |
| Action          | `#245BD7` | Primary controls and focus     |
| Sky             | `#ABD2FA` | Inverse header supporting text |
| Selected        | `#D3E3FC` | Active controls                |
| Panel           | `#E4EDFB` | Grouped content                |
| Line            | `#CCD9EB` | Dividers                       |
| Strong line     | `#7488A7` | Control boundaries             |
| Warning surface | `#FBEFD4` | Missed-report guidance         |
| Urgent surface  | `#432336` | Urgent guidance                |

The Color Hunt navy/blue/sky and bright-blue references are linked in `docs/REACT-BITS-ANIMATION-PROMPTS.md`. Application tokens adjust those swatches for readable text and controls. Legacy variable names `--green`, `--mint` and `--sage` are compatibility aliases for blue values. Palette names never appear in patient copy.

Three self-hosted Latin variable WOFF2 fonts have distinct jobs:

- **Google Sans**: body copy, inputs and controls, 400–700.
- **Funnel Display**: navigation, section headings and task titles, 300–800 available, generally 600–700 used.
- **EB Garamond**: opening title and personal greeting, 400–800 available.

Shared families are `--font-body`, `--font-heading`, and `--font-editorial`. Body and form copy stays approximately 15–16px; desktop greeting is 50px at full size and 34px on mobile. The opening title scales from 42–70px. Care text wraps naturally. Numeric progress uses tabular figures. Complete upstream OFL licenses ship in `public/fonts/`.

## Layout and interaction

Desktop uses an 84px horizontal header, a 1440px maximum page, generous outer spacing and two working columns. Home, My instructions and Progress connect to the existing flows. The greeting sits directly on the page; Add instructions is the primary action. To-Do is a continuous bordered list with large circular checkbox targets and titles only. Important instructions use fine dividers and a quiet surface. The timeline explicitly describes elapsed plan time, with the next real milestone.

The assistant has one transcript, an anchored composer, existing shortcuts and expandable full-screen mode. PromptBar adapts the supplied React Bits composition to actual care functions: controlled draft, growing textarea, shortcut menu, send-to-stop icon and keyboard submission. It does not invent models, external sources, dictation or integrations. Text survives full-screen transitions. Busy input is read-only so keyboard focus remains stable. Cancellation prevents stale results from being committed.

Tooltips explain compact controls on focus or hover. They remain inside the native dialog's top layer, clamp to the panel/viewport, remain reachable by pointer and dismiss with Escape without dismissing the surrounding dialog. Native dialog focus containment and explicit close remain.

Below 850px the app stacks and retains its fixed Home/My plan/Companion dock. Space is reserved below content. Intake keeps a single vertical sequence; doctor name/email pair on desktop and stack on mobile. Forms, source dialogs, check-ins, doses, roadmap, reports and emergency guidance share the same typography and color roles.

The existing plain-text progress report and download remain intact. A separate local email draft preview demonstrates the supplied StatusMark and SquishSwitch. Instructions are optional in that draft; the complete original report still contains them. Preparation uses actual recorded data, labels its state honestly and has no sending action.

Primary actions use pill shapes, icon controls are circular, forms use 14px corners, and panels use 20–24px corners. Message bubbles have directional corners. Structure comes from spacing, borders and tinted surfaces. Existing Lucide icons remain. No portraits, stock product screenshots or decorative feature-card rows are added.

## Motion and loading

The first-paint HTML and React opening share the final canvas and readable title. A scoped GSAP sequence lasts **1.8 seconds**, then enters automatically. Skip enters immediately. Reduced motion bypasses the timed opening, and changing the preference during playback ends it. Session storage remembers entry; the demo controls can replay it.

The supplied **LightTunnel** shader is restricted to the opening: light-mode blue hairlines, low intensity, 24 cables, no pointer steering, no grain or click surges, DPR capped at 1.5. It pauses in hidden tabs and cleans up observers, frames and GPU resources. A static curved-line fallback handles unavailable WebGL or context loss. Reduced motion does not mount the tunnel.

Existing Motion for React handles the prompt menu, send/stop morph, transcript arrivals, switch and report state. Typical changes use 140–360ms; report entry is 200ms. GSAP owns the opening, coordinated entrances, the five new React Bits adaptations, and shared click feedback. Global feedback uses the independent CSS scale property; component motion owns internal elements. The optional short WebAudio tone runs only after trusted activation, is muted with the header control, and remembers that preference. Hover does not move controls. Reduced-motion guards remove displacement and timed effects. Defaults remain readable without animation.

Skeletons represent actual pending work: image load, local reply and report preparation. The report yields a paint before formatting rather than adding a fake delay. Fast local work may show only a brief pending state. No measured frame-rate or 50ms paint guarantee is claimed.

## Product boundaries

The frontend remains a fictional browser-local patient prototype. This UI change does not wire the independently developed backend. Clinician verification, live inference, document extraction, email delivery and hosted doctor links remain deferred. The companion quotes provided text and reports recorded entries; adding instructions does not silently reconfigure the prepared medication schedule or roadmap. Timeline percentage is not healing percentage.

Preserve emergency-on-submission handling, negation guards, draft restoration and visibility even when storage fails. Keep errors within the active dialog.

No pure-white canvas, harsh gradients, drop shadows, glass, rainbow/neon categories, sparkle decorations, colored left stripes, fake testimonials, pricing tiers or legal-footer clutter. No contrast slogans or design-process labels appear in product copy.

Research and adaptation details: [UI-REVAMP-REFERENCES.md](docs/UI-REVAMP-REFERENCES.md). Actual checks: [VERIFICATION.md](docs/VERIFICATION.md).

## Five new React Bits interactions

SpringCheck animates real To-Do reporting controls, RubberSegment moves the desktop navigation pill, JellyRadio animates check-in choices, SwipeToast confirms successful saves with swipe/close dismissal, and CountUp interpolates the actual timeline percentage. Exact copied upstream prompts, app-specific prompts and attribution are in `docs/REACT-BITS-ANIMATION-PROMPTS.md`. Native semantics and reduced-motion behavior take priority over decorative motion.
