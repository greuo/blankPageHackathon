# Design research · October 17, 2026

Current direction: lighter blue, mint and cool off-white, with Nunito Variable and an automatic brand introduction. The earlier seven studies below are historical. Their board is archived at `docs/archive-design-study.html`, outside the public app, to avoid confusing research with product UI. The final app palette is our adaptation.

## Current lighter palette and font research

- [Blue and mint](https://colorhunt.co/palette/3674b5578fcaa1e3f9d1f8ef): #3674B5 #578FCA #A1E3F9 #D1F8EF. Selected relationship: clearer blue actions, airy blue surfaces and a distinct mint support surface.
- [Blue and green contrast](https://colorhunt.co/palette/f8f1f111698e19456b16c79a): #F8F1F1 #11698E #19456B #16C79A. Useful darker foregrounds; original green is too strong for broad backgrounds.
- [Pale sea glass](https://colorhunt.co/palette/effffb50d8904f98ca272727): #EFFFFB #50D890 #4F98CA #272727. Adapted to quieter green and blue-gray ink.
- [Nunito](https://fonts.google.com/specimen/Nunito): friendly rounded letterforms, matching Ranveer's selected font direction. Installed from Fontsource and served locally as one Latin variable WOFF2, with system fallbacks.

Tokens and motion specifications are in `DESIGN.md`. The short intro is a custom SVG/GSAP composition, not copied art. Latest requests explicitly add animations and skeleton loaders; the original static-loading direction below has been superseded. Hover animations remain excluded.

## Earlier palette studies

- [Coastal mineral](https://colorhunt.co/palette/80a1ba91c4c3b4debdfff7dd): #80A1BA #91C4C3 #B4DEBD #FFF7DD. Best starting point. Blue, sea glass, sage and cream.
- [Blue linen](https://colorhunt.co/palette/f5efe6e8dfca6d94c5cbdceb): #F5EFE6 #E8DFCA #6D94C5 #CBDCEB. Useful warm foundation; the blue needs darker text.
- [Sage paper](https://colorhunt.co/palette/f6f0d7c5d89d9cab8489986d): #F6F0D7 #C5D89D #9CAB84 #89986D. Quiet green family. Too yellow for the main canvas.
- [Cloud garden](https://colorhunt.co/palette/a6aebfc5d3e8d0e8c5fff8de): #A6AEBF #C5D3E8 #D0E8C5 #FFF8DE. Good blue-green balance; original colors are sweeter than our final system.
- [Recovery notebook](https://colorhunt.co/palette/789dbcffe3e3fef9f2c9e9d2): #789DBC #FFE3E3 #FEF9F2 #C9E9D2. Strong blue, cream and sage. Leave the pink out.
- [Linen and sky](https://colorhunt.co/palette/d2e0fbf9f3ccd7e5ca8eaccd): #D2E0FB #F9F3CC #D7E5CA #8EACCD. A useful muted blue. Reduce the lemon and periwinkle.
- [Botanical air](https://colorhunt.co/palette/ecf4e8cbf3bbabe7b293bfc7): #ECF4E8 #CBF3BB #ABE7B2 #93BFC7. Good blue-green relationship. Original greens are too bright for this app.

## References and applied judgment

- [Godly: Superpower](https://godly.design/website/superpower/): studied healthcare hierarchy and large photographic composition. No product claims, branding, code, testimonials or proprietary art copied.
- [Deck Gallery: Quantum Wellness guidelines](https://www.deck.gallery/holographik-quantum-spa-brand/): public preview only. Consistent brand application is relevant; gradients, type and circular motifs conflict with Ranveer's brief and were rejected. Full deck requires membership and was not accessed.
- [Transitions.dev](https://transitions.dev/): studied panel/checkbox state patterns. No hover transitions, spring effects, confetti, blur, shimmering, or artificial loading wait. Existing scoped GSAP check feedback remains accessible and reduced-motion aware; decorative completion strokes are removed.
- [NHS typography guidance](https://service-manual.nhs.uk/design-system/styles/typography): consistent semantic headings, readable care copy, clear link affordances. NHS branding/font licensing is not reused.
- Animus.app: actual browser visit redirected to a GoDaddy domain sale page on October 17, 2026. No design guidance claimed from it.

## Images

Locally served images use the [Unsplash license](https://unsplash.com/license). No remote image request is required when using the app.

- Selected `coastal-dunes.jpg`: [Memories on 35mm](https://unsplash.com/photos/landscape-photo-of-a-gray-sandy-beach-rCVcMJqOuuM), film photograph, 2019. Source image `photo-1563212108-03d3b081f91e`, resized to 1600px.
- Study `coastal-grass-study.jpg`: [Christian Loch](https://unsplash.com/photos/Q-wwaD0UVr4), source `photo-1660061548376-abc5c597cef6`, 900px.
- Study `coastal-hills-study.jpg`: [Jonathan Borba](https://unsplash.com/photos/8cEhivA0A5c), source `photo-1647439527387-fc35412ad8da`, 900px.

The alternate photos appear only on the research board. One image establishes the product world without cluttering clinical information.

## Patient-only implementation references

- [ECC frontend patterns](https://github.com/affaan-m/ECC/blob/main/skills/frontend-patterns/SKILL.md): component composition, controlled state and forms. Installed local guidance was verified; runtime availability is recorded separately in the skill audit.
- [React sharing state](https://react.dev/learn/sharing-state-between-components): one draft owner for embedded/full-screen companion views.
- [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): focus containment, explicit close and focus restoration. Native dialog plus existing focus handling was retained.
