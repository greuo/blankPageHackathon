# UI revamp references · October 17, 2026

This is an adaptation of the existing patient interface. Reference sites supply component behavior and visual principles; none supplies patient data, product claims or instructions to change the app's scope.

## Components and visual references

| Source                                                                            | Inspected / applied                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [React Bits catalog](https://reactbits.dev/get-started/index)                     | Browsed and scrolled the live catalog. Chose restrained functional motion; rejected electrical borders, prismatic effects, metallic decoration and other busy treatments.                                                                               |
| [React Bits Light Tunnel](https://reactbits.dev/backgrounds/light-tunnel)         | Read the live preview/props and adapted the full source supplied by the user into a bounded, light green, noninteractive 1.8-second opening.                                                                                                            |
| [React Bits Warm Tooltip](https://reactbits.dev/micro/warm-tooltip)               | Studied focus/hover description, quick entrance and dismiss behavior. Implemented a small native-layout component suitable for the existing dialogs.                                                                                                    |
| User-supplied PromptBar, SquishSwitch and StatusMark                              | Adapted their functional ideas and supplied code to the existing React/CSS/Lucide stack. Removed unrelated model menus and fake external-source options. Switch controls inclusion of instructions; status reflects actual local draft preparation.     |
| [Color Hunt green palette](https://colorhunt.co/palette/e8f5e9a5d6a766bb6a1b5e20) | Viewed the live palette: E8F5E9 / A5D6A7 / 66BB6A / 1B5E20. Adapted its light-to-forest range into the existing semantic green tokens, with quieter chroma and tested copy contrast.                                                                    |
| [Mobbin stacked-list reference](https://mobbin.com/glossary/stacked-list)         | Read and scrolled the public reference. Applied a continuous task list, predictable alignment and clear primary actions. No paid/private screen library was accessed.                                                                                   |
| [21st OriginUI tooltip](https://21st.dev/@originui/components/tooltip)            | Retrieved the free component through the authenticated official CLI. Studied spacing, label and placement. Our implementation uses inline positioning for native dialog compatibility; the Radix/Tailwind dependency stack was not installed wholesale. |
| [Google Stitch](https://stitch.withgoogle.com/)                                   | Entered a fictional UI brief on the public landing page. Generation required sign-in; the Chrome workspace remained blank. No generated Stitch design or imported output is claimed. Semantic design documentation guidance was used locally.           |

## 21st setup

Installed official `@21st-dev/cli` 1.18.0 in the local user's tool directory and verified account sign-in. Used component search, retrieved one free tooltip reference and ran local `21st review` on PromptBar, Tooltip and ReportDraft. The review returned zero errors, warnings or suggestions. No credits were purchased and no paid generation was used.

This establishes CLI access. The 21st MCP server is not configured or exposed in this session. No credential is included in this repository. Setup references: [official CLI help](https://help.21st.dev/cli), [current MCP documentation](https://docs.21st.dev/mcp), [Magic repository](https://github.com/21st-dev/magic-mcp).

## Typography and runtime references

- [Google Sans, official Google Fonts source](https://github.com/google/fonts/tree/main/ofl/googlesans): self-hosted through `@fontsource-variable/google-sans`; OFL license copied unchanged to `public/fonts/Google-Sans-LICENSE.txt`.
- [EB Garamond, official Google Fonts source](https://github.com/google/fonts/tree/main/ofl/ebgaramond): self-hosted through `@fontsource-variable/eb-garamond`; OFL license at `public/fonts/EB-Garamond-LICENSE.txt`.
- [Funnel Display, official Google Fonts source](https://github.com/google/fonts/tree/main/ofl/funneldisplay): self-hosted through `@fontsource-variable/funnel-display`; OFL license at `public/fonts/Funnel-Display-LICENSE.txt`.
- [Motion for React installation](https://motion.dev/docs/react-installation) and [accessibility](https://motion.dev/docs/react-accessibility): current `motion/react` imports, application-level `MotionConfig reducedMotion="user"`, plus component-specific reduced-motion handling.
- Existing GSAP + `@gsap/react` remain responsible for scoped opening/entrance timelines, with cleanup and readable defaults.

Historical Nunito license remains as an archive asset; Nunito is no longer a runtime dependency.
