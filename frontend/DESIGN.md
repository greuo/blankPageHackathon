# Discharge Companion design

Mode: Operate. Opening screen: welcome and orientation, with one immediate action into the working prototype. Ranveer requested a replacement visual world on October 17, 2026. This supersedes the earlier DM Sans/Manrope, white, rounded-card direction.

## Design DNA

Quiet coastal care notebook. The interface should feel composed, health-conscious and readable in a home recovery setting. Photographic space and book-like major headings establish identity. Care information uses consistent humanist typography and flat surfaces.

### Color system

| Token        | Value     | Role                              |
| ------------ | --------- | --------------------------------- |
| Canvas       | `#F2F0E7` | Warm ivory page, never pure white |
| Surface      | `#F8F6EE` | Forms and focused dialogs         |
| Mineral blue | `#D4E0E6` | Welcome zone and sent messages    |
| Sage         | `#DCE3D6` | Shared-support surfaces           |
| Sidebar      | `#E8EBDF` | Quiet navigation field            |
| Forest       | `#355C4C` | Primary actions, selected states  |
| Ink          | `#283D38` | Main text and navigation icons    |
| Muted        | `#53665E` | Supporting text                   |
| Line         | `#C6CEC3` | Flat dividers                     |
| Earth        | `#765735` | Caution text                      |
| Danger       | `#8C4339` | Error/destructive action          |

Adapted from [Color Hunt coastal palette](https://colorhunt.co/palette/80a1ba91c4c3b4debdfff7dd), with lower chroma, a neutral ivory and purpose-built dark foregrounds. Exact source palettes and three photo candidates are in [design research](docs/DESIGN-RESEARCH.md) and the local `/design-study.html` board. Cream is a deliberate brief-derived choice, not an inferred default.

### Typography

Self-hosted Newsreader 400 for major headings/wordmark; Source Sans 3 400/500/600/700 for controls, instructions and supporting text. Source Sans 3 is humanist, distinct from the banned grotesque examples. Roman display headings, no oversized italic hero. The opening heading scales 52–90px; workspace title 38–58px; sections 26–29px; care rows 18px; messages and editable inputs 16px; task copy 15px; secondary details 12–14px. Clinical text stays on plain surfaces and never overlays photography.

### Layout, spacing and shape

Desktop uses a 200–222px navigation rail, a 75px utility bar, a full-width welcome band, then two useful columns: care spaces and daily guidance. The five contexts are separated rows, with no colored tiles or three-card grid. Below 960px the working columns stack. Below 760px navigation moves to a horizontal text row; the opening becomes text above a landscape.

Spacing is based on 4/8/12/16/24/32/40 units. Controls and surfaces use 3px corners; avatars may be circular. Dividers establish grouping. No shadows, colored left stripes, pure-white surfaces, radial orbs, gradients, sparkle decorations, neon, rainbow category colors or floating glass effects.

### Imagery

A locally served film photograph of dunes and sea by Memories on 35mm. Its blue, sage and sand connect the palette to a real scene. The opening uses it at half-screen scale. A short crop returns in the workspace. Alternate images appear only on the research board. Attribution and license records are in the research document.

### Effects and states

The HTML response includes a styled first-paint composition, image preload, readable fallback serif and the same warm canvas as React. No opacity-zero introduction or artificial waiting period. A real user action opens the workspace; session storage remembers entry during the session. The sidebar wordmark reopens the welcome screen.

No hover animation. The existing scoped GSAP checkbox confirmation remains brief and reduced-motion aware; decorative completion strokes are removed. Real asynchronous work uses static, compact loading feedback. Never insert a fake 100ms delay. End-to-end first paint within 50ms is not guaranteed by local markup and depends on hosting/device/network.

All meaningful states remain explicit: pending, disabled, failed, empty, approved, private and saved. Keyboard focus uses forest outlines. Protected dialogs retain focus containment and Escape dismissal. The palette applies to plan creation, conversations, documents, access and handoff as well as the overview.

## Product truth

This remains a browser-local fictional frontend. Backend connection is deferred. The welcome and design changes must not change permission rules, imply server authentication, invent clinical guidance or make delivery claims. No testimonials, pricing, legal footer clutter or marketing feature rows are introduced.
