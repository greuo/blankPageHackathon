# Discharge Companion design

Current direction, October 17, 2026: light blue, mint and cool off-white, friendly rounded typography and a short automatic introduction. This replaces the earlier ivory/serif direction. Design names, palette choices and research language belong in these documents, never in product copy.

## Design DNA

A calm recovery workspace with a clearer blue presence. Flat rows, small corners, readable guidance and consistent spacing keep the experience composed. Green communicates support and confirmation; blue identifies actions and selected surfaces. No gradients, shadows, pure-white backgrounds, rainbow categories, colored left stripes, sparkle decorations, glass effects or animated arrows.

| Token       | Value     | Role                              |
| ----------- | --------- | --------------------------------- |
| Canvas      | `#F5F9FC` | Cool off-white page               |
| Surface     | `#FAFDFE` | Forms and dialogs                 |
| Blue        | `#D6EDFB` | Welcome zone and message surfaces |
| Mint        | `#DAF1E6` | Support and confirmation surfaces |
| Action      | `#3271AB` | Primary buttons                   |
| Green       | `#247454` | Confirmation and approved states  |
| Rail        | `#EAF2F6` | Navigation field                  |
| Selected    | `#D7E8F2` | Selected navigation               |
| Ink         | `#20394A` | Text and navigation icons         |
| Muted       | `#4F6470` | Supporting copy                   |
| Line        | `#C1D2DA` | Dividers                          |
| Strong line | `#819BA9` | Control boundaries                |
| Earth       | `#805D2A` | Caution                           |
| Danger      | `#9A453D` | Errors and destructive actions    |

Adapted from [Color Hunt blue and mint](https://colorhunt.co/palette/3674b5578fcaa1e3f9d1f8ef), with lighter surfaces and darker readable foregrounds. See [research](docs/DESIGN-RESEARCH.md) for alternatives and attribution.

## Typography and structure

Self-hosted **Nunito Variable**, one Latin WOFF2 asset, replaces Newsreader and Source Sans 3. Its softer letterforms follow Ranveer's confirmed preference. Body text is 400; headings generally 650–750. Workspace titles scale 32–48px, sections 25–26px and care rows 18px. Editable inputs and messages remain 16px. Care information stays on plain surfaces, outside photography.

Desktop retains a navigation rail, utility bar, welcome band and two working columns. Five care contexts use divided rows. Columns stack below 960px; navigation becomes a horizontal text row below 760px. Spacing follows 4/8/12/16/24/32/40 units; corners are 3px. The locally served dune photograph remains in the workspace, with a genuine pending-image skeleton.

## Opening and motion

The initial HTML contains the same centered monogram, title, tagline and canvas as React. An authored GSAP sequence draws two blue/green frame paths, settles the monogram and type, then automatically opens the workspace after approximately 1.06 seconds. A visible Skip intro control enters immediately. Session storage remembers entry; the sidebar wordmark replays the intro. Focus moves into main on completion.

Reduced motion bypasses the timed intro and removes spatial/transitional effects. GSAP selectors are scoped with lifecycle cleanup; skip cancels the active sequence. The interface remains readable without animation. A 50ms end-to-end paint time is not guaranteed.

Workspace sections, tab content, conversations, newly shown messages, disclosures and dialogs have short state transitions. Dialog exit lasts 140ms and preserves native modality and focus restoration. Hover remains static. Skeletons show only while images or replies are actually pending, with a quiet opacity pulse and no shimmer gradient. No artificial loading delay is inserted.

## Product truth

This remains a fictional browser-local frontend. Backend connection is deferred. No server authentication, live LLM or remote delivery is implied. Existing permissions and publication behavior remain intact. The next larger overhaul is patient-focused, with clinician input and a patient companion, pending Ranveer's full prompt/reference image.

## Patient-only reference implementation

Ranveer supplied two selected reference images: a patient dashboard with task/important-guidance/timeline stack beside a companion, and a centered Add instructions form. The current app uses that composition. It replaces the navigation rail and care-space overview with a simple horizontal Home header, notifications and patient report control. The photograph and role picker are absent from the patient UI.

At 1536px the dashboard uses approximately two-thirds content and one-third chat, with a 24px gap and 32px page inset. The chat is sticky and independently scrollable. Below 850px the content stacks and chat becomes an in-page panel. Add instructions uses a 1080px maximum width, two doctor fields on desktop, one column on mobile, a large source textarea and a file drop target. Form fields align at the top.

User-selected Nunito and cool off-white tokens intentionally override the reference's pure white, shadows and stronger roundness. Panels use 8–10px corners, rows 6px and chat bubbles 9px. Icons come from the existing Lucide library. No raster illustration is needed for these functional screens. The pre-existing custom geometric opening remains, now titled Care companion.
