# Five React Bits integration prompts

These are the five app-specific implementation prompts used for this pass. The complete, unchanged prompts copied with **React Bits → Copy for AI → Copy prompt** on 2026-10-17 are preserved alongside them. The copied source is reference material for this application, not instructions to change dependencies, upload data or replace patient behavior.

## 1. Spring Check: To-Do reporting

**Prompt:** Integrate React Bits SpringCheck into each existing To-Do reporting control. Retain the controlled checked state and original task action, including opening medication and check-in dialogs. Adapt the source's swelling circular fill and SVG tick draw to scoped GSAP timelines. Keep the title button separate, preserve the title-only rows, and do not restore descriptions or arrows. Use the app's cobalt action and sky surface tokens. Provide native checkbox semantics, a 44px target, keyboard activation, interruption cleanup and a static reduced-motion state. Do not mark a report complete until the existing store accepts it.

Source: https://reactbits.dev/micro/spring-check

Original copied prompt: [SpringCheck.txt](react-bits-prompts/SpringCheck.txt)

Implementation: `src/components/react-bits/SpringCheck.tsx`, used by `patient/PatientApp.tsx`.

## 2. Rubber Segment: main navigation

**Prompt:** Adapt React Bits RubberSegment to the existing Home, My instructions and Progress navigation. Carry over the pill's leading-edge stretch, trailing-edge catch-up and settling motion using GSAP. The active value must come from the existing route/dialog state. Preserve ordinary navigation buttons and visible focus; do not add dragging that could open a patient's dialog accidentally. Recalculate the pill after layout and font changes, hide it when no option is selected, and remove displacement under reduced motion. Use a pale blue track and navy text with no shadow or hover movement.

Source: https://reactbits.dev/micro/rubber-segment

Original copied prompt: [RubberSegment.txt](react-bits-prompts/RubberSegment.txt)

Implementation: `src/components/react-bits/RubberSegment.tsx`, used in the desktop header.

## 3. Jelly Radio: daily check-in

**Prompt:** Integrate React Bits JellyRadio into the existing Low, Okay and Good feeling options. Preserve the actual form values, validation and native radio keyboard behavior. Adapt the selected pill's swell and restrained neighbor displacement to GSAP. Keep the label and text stable and readable, allow rapid changes without accumulated transforms, and use a direct checked state with reduced motion. Use the same blue tokens and rounded controls as the rest of the care form. A feeling choice must never save the form by itself.

Source: https://reactbits.dev/micro/jelly-radio

Original copied prompt: [JellyRadio.txt](react-bits-prompts/JellyRadio.txt)

Implementation: `src/components/react-bits/JellyRadio.tsx`, used in the check-in dialog.

## 4. Swipe Toast: successful saves

**Prompt:** Adapt React Bits SwipeToast to successful instruction and check-in saves. Use the existing success message, a short GSAP arrival and downward swipe dismissal with a spring-back for incomplete swipes. Include a clear keyboard-accessible close button and a polite live status. Keep the confirmation visible until dismissed, replacing the reference's automatic countdown. Never use this component for errors or urgent medical guidance and never display success before the existing save succeeds. Cancel all listeners and animation on unmount; respect reduced motion.

Source: https://reactbits.dev/micro/swipe-toast

Original copied prompt: [SwipeToast.txt](react-bits-prompts/SwipeToast.txt)

Implementation: `src/components/react-bits/SwipeToast.tsx`, used above To-Do after a successful save.

## 5. Count Up: real timeline progress

**Prompt:** Adapt React Bits CountUp to the existing recovery timeline's actual elapsed-time percentage. Use GSAP numeric interpolation with a short ease-out, tabular figures, and no invented counters. Keep a stable accessible final value and hide intermediate frames from screen readers. Changes must start from the currently displayed number and cancel safely on unmount. Reduced motion displays the final number immediately. Preserve the words “of planned time” and the existing explanation that elapsed time is separate from healing.

Source: https://reactbits.dev/text-animations/count-up

Original copied prompt: [CountUp.txt](react-bits-prompts/CountUp.txt)

Implementation: `src/components/react-bits/CountUp.tsx`, used in Recovery timeline.

## Shared treatment

Apply the five components as parts of the existing patient app. GSAP supplies shared press-and-release feedback on enabled controls and coordinates the opening and entrances. A brief synthesized click tone starts only from a trusted user activation. A visible Sound on/off control remembers the user's preference; audio failure must not block any task. Preserve all current records, provided instruction text, the local assistant, report preview, emergency flow and full-screen composer draft.

The earlier supplied PromptBar, SquishSwitch, StatusMark and LightTunnel adaptations remain in use. LightTunnel stays confined to the 1.8-second opening. Existing Motion for React effects continue where already integrated; GSAP does not compete for those elements' transform property.

## Reference and attribution

React Bits, Copyright (c) 2026 David Haz. The complete upstream **MIT + Commons Clause License Condition v1.0** is preserved in [LICENSE.md](react-bits-prompts/LICENSE.md). These adaptations and their reference prompts are included as part of Care companion.

Palette references inspected: [navy / blue / sky](https://colorhunt.co/palette/0915401b2cc17692ffabd2fa), [bright blue / sky](https://colorhunt.co/palette/2373f4578ef565d0f4f2f7a0). The application adjusts these references to readable interface tokens; it does not use every swatch or present palette names in the product.
