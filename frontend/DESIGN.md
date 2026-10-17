# Care companion design

Current direction: a calm patient workspace with pale leaf surfaces, forest ink, an editorial greeting and compact, readable controls. Preserve the existing patient-only information, source text, reporting and local demo behavior. Ranveer's desktop references define the structure; his mobile references inform grouping and hierarchy. The latest green-only instruction supersedes the older blue palette.

## Color and type

| Token          | Value     | Use                              |
| -------------- | --------- | -------------------------------- |
| Canvas         | `#F1F5EE` | Page and first paint             |
| Surface        | `#F9FBF5` | Forms, rows and dialogs          |
| Ink            | `#193C2B` | Primary copy and icons           |
| Muted          | `#536957` | Supporting copy                  |
| Action         | `#285E3E` | Primary controls and focus       |
| Green          | `#386E4B` | Brand and reported state         |
| Mint           | `#DFEDCF` | Patient message and confirmation |
| Sage           | `#E8EFDF` | Soft supporting surfaces         |
| Panel          | `#EAF1E3` | Assistant and guidance           |
| Strong panel   | `#E0ECD5` | Grouped state                    |
| Selected       | `#D7E8C8` | Selected navigation              |
| Line           | `#D0DCC8` | Dividers                         |
| Strong line    | `#778D70` | Control boundaries               |
| Progress       | `#3B7650` | Timeline fill                    |
| Urgency        | `#123B22` | Urgent and destructive controls  |
| Urgent surface | `#163D28` | Inverse emergency panel          |
| Urgent text    | `#F0F6E7` | High-contrast emergency copy     |

Tokens live in `src/styles.css`. Colors adapt the pale-to-forest range of the cited Color Hunt reference to the existing product. Urgent guidance remains distinct through an inverse surface, explicit words, phone icon and clear primary/secondary action hierarchy. Palette names and design commentary do not appear in product copy.

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

Corners stay restrained, usually 5–12px. Structure comes from spacing, borders and tinted surfaces. Existing Lucide icons remain. No portraits, stock product screenshots or decorative feature-card rows are added.

## Motion and loading

The first-paint HTML and React opening share the final canvas and readable title. A scoped GSAP sequence lasts **1.8 seconds**, then enters automatically. Skip enters immediately. Reduced motion bypasses the timed opening, and changing the preference during playback ends it. Session storage remembers entry; the demo controls can replay it.

The supplied **LightTunnel** shader is restricted to the opening: light-mode green hairlines, low intensity, 24 cables, no pointer steering, no grain or click surges, DPR capped at 1.5. It pauses in hidden tabs and cleans up observers, frames and GPU resources. A static curved-line fallback handles unavailable WebGL or context loss. Reduced motion does not mount the tunnel.

Motion handles the prompt menu, send/stop morph, transcript arrivals, switch and report state. Typical changes use 140–360ms; report entry is 200ms. GSAP owns the opening and existing coordinated entrances. Each element has one animation owner. Hover does not move controls. Reduced-motion guards remove displacement and timed effects. Defaults remain readable without animation.

Skeletons represent actual pending work: image load, local reply and report preparation. The report yields a paint before formatting rather than adding a fake delay. Fast local work may show only a brief pending state. No measured frame-rate or 50ms paint guarantee is claimed.

## Product boundaries

The frontend remains a fictional browser-local patient prototype. This UI change does not wire the independently developed backend. Clinician verification, live inference, document extraction, email delivery and hosted doctor links remain deferred. The companion quotes provided text and reports recorded entries; adding instructions does not silently reconfigure the prepared medication schedule or roadmap. Timeline percentage is not healing percentage.

Preserve emergency-on-submission handling, negation guards, draft restoration and visibility even when storage fails. Keep errors within the active dialog.

No pure-white canvas, harsh gradients, drop shadows, glass, rainbow/neon categories, sparkle decorations, colored left stripes, fake testimonials, pricing tiers or legal-footer clutter. No contrast slogans or design-process labels appear in product copy.

Research and adaptation details: [UI-REVAMP-REFERENCES.md](docs/UI-REVAMP-REFERENCES.md). Actual checks: [VERIFICATION.md](docs/VERIFICATION.md).
