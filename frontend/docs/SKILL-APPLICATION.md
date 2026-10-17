# Skill application audit: patient experience overhaul

Date: October 17, 2026, America/New_York. Workspace: `/Users/macbook/Documents/ChatGPT/BLANKPAGE REAL`.

This document records a read-only skill-selection audit performed alongside the patient-interface implementation. Its author owns only this report. It does not certify execution of every installed skill or of tools merely mentioned in a skill.

## Coverage and evidence levels

The filesystem inventory contains **51 top-level personal packages**, **71 personal SKILL.md entrypoints including nested Genjutsu modules**, **209 historical plugin SKILL.md snapshots**, and **2 reference-only service SKILL.md files**: **282 canonical local entrypoints**. The catalog still says 49 personal packages; the two later additions are ECC `frontend-patterns` and `product-lens`. The count of 71 personal entrypoints is unrelated to the count of 71 ECC agent roles.

The audit covered every canonical entrypoint by filename, package identity, catalog/frontmatter description, and family applicability. A local inventory process read the 282 files (3,261,757 bytes); this is an inventory operation, **not a claim that the model studied every body or executed every workflow**. Detailed readings were limited to relevant guidance. Current host-managed skills were screened from the active session catalog separately; they are not included in the 282 local-entrypoint count and should not be double-counted as historical snapshots.

| Evidence level                       | Work actually performed                                                                                                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete local metadata screen       | All 282 canonical entrypoints inventoried; appendix below lists each. Historical package families and current managed replacements compared.                                                                                                                |
| Complete relevant text consulted     | SKILL-ROUTING.md, MAC-RUNTIME.md; Design DNA; Awesome Design MD; continuity; Genjutsu paint/cast wrapper files; ECC product-lens; historical codebase-memory and Claude consolidate-memory.                                                                 |
| Targeted relevant excerpts consulted | UI/UX Pro Max, make-interfaces-feel-better, Impeccable setup/modes, design-taste-frontend eligibility, frontend-patterns composition/state guidance; ECC reviewer adaptations. These are not recorded as complete end-to-end workflow execution.            |
| Memory consulted                     | Scope/ECC skill checkpoint, care-space/ECC agent checkpoint, latest patient-overhaul direction checkpoint. Current user instructions supersede dated planning.                                                                                              |
| Integrity checks actually executed   | All 71 ECC original SHA-256 and Git blob hashes checked against manifest; all 71 Codex TOMLs parsed; all 71 discovery symlinks resolved. Frontend/product-lens file sizes and SHA-256 checked against their installation checkpoint.                        |
| Guidance delivered to implementation | Preserve existing tokens and patient reference layout; flat surfaces; bounded loading; accessible forms/chat/focus; real desktop/mobile browser QA; React and TypeScript review lanes; no unrelated dependencies or design workflows.                       |
| Not executed by this audit           | No browser, design canvas, clinical validation, full security scan, video/image generation, cloud publishing, account action, or unrelated skill workflow. Implementation/build/browser/PR results must come from the implementation owner's actual checks. |

## Applicable and deferred families

| Family                                                                                                           | Decision                           | Concrete guidance and limit                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI/UX Pro Max                                                                                                    | Apply                              | Accessible contrast; 44px touch targets where practical; labels and local errors; keyboard/focus; responsive layout; loading feedback. Preserve the user's palette and Nunito rather than adopting generated replacements.                                                 |
| Impeccable                                                                                                       | Apply in Operate mode              | Task completion, scanability, forms and state clarity. Relevant references: `reference/new-work.md`, `reference/operate.md`, `reference/craft-floor.md`, `reference/adapt.md`, `reference/harden.md`. Actual context-command execution belongs to implementation evidence. |
| Design DNA                                                                                                       | Apply selectively                  | Extract hierarchy, spacing, shape and reusable tokens from supplied references; keep prior mint/light-blue/offwhite identity. Decorative visual-effect categories are disabled. Measurement scripts were not executed by this audit.                                       |
| Awesome Design MD                                                                                                | Supporting reference               | Transfer hierarchy/spacing principles from one coherent product reference such as `references/cal/DESIGN.md`; do not copy another brand. Reference choice was recommended, not claimed executed here.                                                                      |
| make-interfaces-feel-better                                                                                      | Apply selectively                  | Typography, icon consistency, hit areas and structural borders. Relevant `typography.md`, `surfaces.md`, `icons.md`; shadows and scale effects conflict with the brief.                                                                                                    |
| redesign-existing-projects                                                                                       | Supporting                         | Audit incumbent UI and preserve functionality while changing the patient surface. No permission to broaden into unrelated backend or clinician workflows.                                                                                                                  |
| Genjutsu / paint / cast / nested modules                                                                         | Apply selectively                  | Coherent layout, responsive principles and purposeful loading feedback. No decorative canvas, particles, 3D, scroll theatrics, or animated hover treatment.                                                                                                                |
| ECC frontend-patterns                                                                                            | Apply                              | React component composition, state ownership, controlled forms, navigation, loading and accessible UI. Examples are incomplete patterns, not production-ready tab/dialog implementations.                                                                                  |
| ECC product-lens                                                                                                 | Supporting only                    | Use the existing patient journey and feature scope; do not reopen settled product direction or require a founder exercise before implementing.                                                                                                                             |
| ranveer-project-continuity                                                                                       | Apply                              | Read verified project notes, verify current workspace files, save a scoped completion checkpoint with actual checks. No automatic synchronization or perfect-recall claim.                                                                                                 |
| full-output-enforcement                                                                                          | Apply                              | Finish authorized features and report real limits; no placeholders or requests to continue merely to finish work.                                                                                                                                                          |
| playwright / current browser tools                                                                               | Apply during implementation QA     | Desktop/mobile, chat expand/collapse, form/upload states, keyboard/focus, loading completion and reduced motion. Audit author did not run the browser.                                                                                                                     |
| design-taste-frontend / v1 / gpt-taste                                                                           | Defer                              | Marketing/landing-page prescriptions do not govern a patient dashboard. V2 explicitly excludes dashboards and multistep product UI.                                                                                                                                        |
| minimalist-ui / high-end-visual-design                                                                           | Selective only                     | Flat surfaces, spacing and typography ideas may fit. Do not replace Nunito or reintroduce shadows and movement.                                                                                                                                                            |
| industrial-brutalist-ui / stitch-design-taste                                                                    | Defer                              | Incompatible aesthetic or absent Stitch workflow.                                                                                                                                                                                                                          |
| image-to-code / imagegen-frontend-web/mobile / brandkit                                                          | Defer                              | Supplied reference screens already establish structure; no fresh brand boards or concept-image production needed. The local image-to-code requirement to generate images is unnecessary for this task.                                                                     |
| All eight GSAP skills                                                                                            | Conditional                        | Use existing project GSAP only for brief-supported behavior if needed, with cleanup and reduced motion. Avoid adding a dependency solely because a skill mentions it.                                                                                                      |
| All twelve Remotion skills / HyperFrames                                                                         | Defer                              | No video deliverable.                                                                                                                                                                                                                                                      |
| scrapling-official                                                                                               | Conditional                        | Public-reference extraction only if it adds necessary evidence. No scraping executed here.                                                                                                                                                                                 |
| awesome-mcp-servers / free-for-dev                                                                               | Defer                              | No missing service integration or hosting-cost decision requires research.                                                                                                                                                                                                 |
| genjutsu-bunshin                                                                                                 | Conditional                        | Coordination only if useful and authorized; not a requirement to start unrelated builders.                                                                                                                                                                                 |
| ranveer-typing-style                                                                                             | Defer                              | No request to write in Ranveer's personal voice.                                                                                                                                                                                                                           |
| hatch-pet / managed work-pets                                                                                    | Defer                              | No pet deliverable.                                                                                                                                                                                                                                                        |
| Current Product Design                                                                                           | Selective                          | Faithful supplied-image implementation and screenshot-based audit are relevant; fresh ideation is unnecessary. Use current managed instructions rather than old snapshots.                                                                                                 |
| Current Designly                                                                                                 | Selective                          | Composition, hierarchy, typography, brand fidelity and visual QA can support the brief. Campaign, Arabic/RTL, photography, manipulation, narrative and prompt-generation lanes are not needed. No Designly tool run claimed.                                               |
| Current Superdesign                                                                                              | Conditional, no tool found         | Relevant design capability in principle; no callable Superdesign tool found in this audit's tool inventory. No canvas execution claimed.                                                                                                                                   |
| Current Codex Security                                                                                           | Conditional                        | Diff/security workflows only when their stated scope applies; a UI overhaul does not imply an exhaustive scan, exploit validation or new threat-model artifact.                                                                                                            |
| Current Sites                                                                                                    | Defer for publishing               | Work is in an existing repository; no Sites publishing workflow was required for this audit.                                                                                                                                                                               |
| Current Supabase / Postgres                                                                                      | Conditional                        | Apply only if actual database/auth/backend integration changes; do not turn a local frontend demo into an unsolicited backend build.                                                                                                                                       |
| Current Google Drive/Docs/Sheets/Slides, Pages, documents/PDF, presentations, spreadsheets, templates, visualize | Defer unless input format requires | App work does not require these artifact workflows. A PDF attachment could justify PDF reading; no such execution is claimed here.                                                                                                                                         |
| Current Hostinger                                                                                                | Defer                              | No hosting-account action in this audit.                                                                                                                                                                                                                                   |
| Current imagegen                                                                                                 | Defer                              | No new raster asset required for the supplied flat task screens.                                                                                                                                                                                                           |
| Current openai-docs / skill-creator / skill-installer / plugin-management                                        | Defer                              | No configuration, installation or plugin-management objective.                                                                                                                                                                                                             |
| Historical plugin snapshots                                                                                      | Metadata-screened references only  | All 209 listed below. Prefer current managed equivalents. Vercel React guidance may support implementation; deployment/AI SDK/hosting/auth services and NVIDIA/Omniverse work are unrelated.                                                                               |
| codebase-memory / freellmapi-codex / Claude consolidate-memory snapshot                                          | Historical only                    | Do not activate old Windows endpoints/providers, assume a missing memory vault, or consolidate unrelated user memories. Current local continuity is the applicable substitute.                                                                                             |

## Relevant paths and concrete implementation guidance

Personal skill root: `/Users/macbook/Documents/Codex/SkillsCodex/skills/`. Each name below resolves to `<root>/<name>/SKILL.md`:

- `ui-ux-pro-max`: `references/quick-reference.md`, `references/pro-rules.md`, `scripts/search.py`.
- `impeccable`: `scripts/impeccable`, references listed above. User scope and bounded verification override broad creative rhetoric.
- `design-dna`: `references/schema.md`, `references/generation-guide.md`; `scripts/measure-colors.mjs` only if measured reference-color extraction is actually required and assets are available.
- `make-interfaces-feel-better`: typography, surfaces and icons references listed above; preserve the existing styling system.
- `genjutsu-paint` and `genjutsu-cast`: wrappers lead to `../genjutsu/SKILL.md`, then `../genjutsu/upstream/skills/paint/SKILL.md` and `cast/SKILL.md`.
- `frontend-patterns`: installed ECC React/frontend skill, 15,432 bytes; SHA-256 `a5b971eb9e74cd763c7e3308bfd888e0d9cf69f8b88477659889d77182479740`.
- `product-lens`: installed ECC product/journey support, 3,373 bytes; SHA-256 `58b82c847304b0c4fbf456c1f4ae9205f3733e011f8cbdeed30687f111a098c6`.
- `ranveer-project-continuity`: canonical memory root below; current local guidance, not a replacement claim about unavailable historical services.
- `playwright`: `scripts/playwright_cli.sh`; actual usable runtime must be checked for the current QA session.

Guidance handed to implementation: use semantic forms with visible labels and useful validation; preserve chat state across embedded/fullscreen views; make expand/close controls keyboard reachable and restore focus where appropriate; use static skeletons or reduced-motion-safe loading treatment; finish the automatic splash promptly; keep content readable when motion is disabled; validate real interaction states rather than checking only build output.

## Memory coverage

Memory root: `/Users/macbook/Documents/Codex/SkillsCodex/memory/projects/blankpage-real/`.

Detailed checkpoints consulted:

1. `2026-10-17-1015-scope-and-ecc-skills.md`: corrected care-instruction scope; two standalone ECC skills installed from a pinned source; broad earlier logistics assumptions were rejected.
2. `2026-10-17-ecc-agents-and-care-spaces.md`: 71 ECC agent installation; shared/private context distinctions; AI content remains draft until approved; engineering review is not clinical validation.
3. `2026-10-17-patient-overhaul-direction.md`: newest patient-first overhaul direction; supplied references/spec govern implementation; repository PR/review workflow retained.

Other checkpoints were inventoried but not claimed fully read by this audit: `2026-10-17-frontend-0937153.md`, `2026-10-17-1123-quiet-coastal-pr3.md`, `2026-10-17-discharge-companion-handoff.md`, `2026-10-17-discovery.md`, `2026-10-17-repo-and-brief-update.md`, and the push-check JSON. Their existence does not make every dated instruction current. The live request supersedes the old clinician-centered emphasis and old motion preferences where it explicitly forbids hover animation, shadows and gradients.

## ECC installation, role use and limits

Pinned source: `https://github.com/affaan-m/ecc`, commit `76aaa77df6adc5b889e689007bf99b9a4f74af34`.

Canonical bundle: `/Users/macbook/Documents/Codex/SkillsCodex/agent-library/ecc/76aaa77df6adc5b889e689007bf99b9a4f74af34/`.

- `manifest.json`: all 71 source URLs, Git blob IDs, SHA-256 values, sizes and descriptions.
- `source/`: 71 original Markdown roles.
- `codex/`: 71 Codex TOML adaptations.
- `INDEX.md`: complete role index.
- `/Users/macbook/.codex/agents/ecc_*.toml`: 71 verified resolving discovery symlinks.

This is a selected local installation of all agent definitions plus two standalone skills, **not a full ECC repository checkout**. Integrity checks matched all 71 originals and all TOMLs parsed. Roles are definitions, not 71 simultaneously running workers.

For changed TSX, the useful review lanes are `ecc_react_reviewer` (hooks, rendering, component/focus/accessibility) and `ecc_typescript_reviewer` (types, async correctness, generic JS/TS safety), with `ecc_code_reviewer` for the general change. `ecc_a11y_architect`, `ecc_e2e_runner`, `ecc_healthcare_reviewer`, `ecc_security_reviewer` and `ecc_performance_optimizer` are relevant as their concrete scope warrants. `ecc_react_build_resolver` is conditional on a failed React build. `ecc_commit_reviewer` is relevant before committing. This audit screened role applicability and read selected reviewer instructions; it does not claim those reviews all ran.

Every installed adaptation explicitly makes imported automatic-routing language, prescribed tools, models, quotas and workflow defaults conditional on current system/project/user authority. In particular, the healthcare role cannot establish clinical validation or regulatory compliance from a frontend engineering review. Do not invent dosing logic, document parsing, real email delivery, clinical approval or live AI integration.

## Tools, dependencies and conflicts

- Current callable-tool metadata contained no Context7, Stitch, Superdesign or Designly tool. Skill availability does not prove a connected tool exists. Do not claim those tools ran.
- `agent-browser`, `claude` and `gh` did not resolve on this audit subprocess's PATH. This is not proof they are absent from disk or from another configured runtime. GitHub connector and code-review/CI tools are available separately.
- `MAC-RUNTIME.md` records Node at `/Users/macbook/.local/node-v22.23.2-darwin-x64/bin/node`, the isolated Python at `/Users/macbook/Documents/Codex/SkillsCodex/runtime/python/bin/python`, and a bundled Playwright path. Those are runtime references, not proof that this specific app passed browser QA.
- Referenced ECC packages `react-patterns`, `react-testing`, `accessibility`, `coding-standards`, `product-capability`, `agent-self-evaluation`, `browser-qa` and `canary-watch` were not installed standalone personal skills in this inventory. They are not a reason to pretend their commands ran or install unrelated packages.
- Explicit user constraints win: no gradients, no shadows, no hover animation; preserve Nunito, blue/mint/offwhite and the screenshot-derived patient workflow.
- Landing-page defaults, random marketing layouts, 3D/canvas effects, mandatory generated images, new component-system adoption and animation quotas do not govern this dashboard.
- Do not claim clinical validation, real uploads/email delivery, external-model privacy or backend integration from a frontend demo.
- Metadata screening of unrelated skills is complete; their workflows remain deferred rather than superficially executed to reach a skill count.

## Complete local entrypoint inventory

Paths in the tables below are relative to the canonical root `/Users/macbook/Documents/Codex/SkillsCodex/`. Every row has **metadata-screened** status unless the evidence sections above identify a deeper reading or an executed integrity check. A deferred entry is still covered by the screen. Historical snapshots are retained documentation, not live connectors.

### Personal packages and nested modules (71 entrypoints)

| Entrypoint                                                              | Screen result                                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `skills/awesome-design-md/SKILL.md`                                     | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/awesome-mcp-servers/SKILL.md`                                   | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/brandkit/SKILL.md`                                              | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/design-dna/SKILL.md`                                            | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/design-taste-frontend/SKILL.md`                                 | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/design-taste-frontend-v1/SKILL.md`                              | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/free-for-dev/SKILL.md`                                          | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/frontend-patterns/SKILL.md`                                     | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/full-output-enforcement/SKILL.md`                               | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/genjutsu/SKILL.md`                                              | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/genjutsu/upstream/skills/_jutsu/canvas-generative/SKILL.md`     | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/compose-graphics/SKILL.md`      | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/compose-motion/SKILL.md`        | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/compose-multiplatform/SKILL.md` | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/css-native/SKILL.md`            | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/design-audit/SKILL.md`          | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/desktop-principles/SKILL.md`    | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/framer-motion/SKILL.md`         | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/gsap/SKILL.md`                  | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/mobile-principles/SKILL.md`     | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/motion-principles/SKILL.md`     | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/orchestration/SKILL.md`         | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/swiftui-graphics/SKILL.md`      | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/swiftui-motion/SKILL.md`        | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/tells/SKILL.md`                 | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/threejs-r3f/SKILL.md`           | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/_jutsu/ui-ux-pro-max/SKILL.md`         | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/bunshin/SKILL.md`                      | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/cast/SKILL.md`                         | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu/upstream/skills/paint/SKILL.md`                        | Nested Genjutsu guidance; select only relevant desktop/mobile/CSS/audit principles.         |
| `skills/genjutsu-bunshin/SKILL.md`                                      | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/genjutsu-cast/SKILL.md`                                         | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/genjutsu-paint/SKILL.md`                                        | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gpt-taste/SKILL.md`                                             | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gsap-core/SKILL.md`                                             | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gsap-frameworks/SKILL.md`                                       | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gsap-performance/SKILL.md`                                      | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gsap-plugins/SKILL.md`                                          | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gsap-react/SKILL.md`                                            | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gsap-scrolltrigger/SKILL.md`                                    | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gsap-timeline/SKILL.md`                                         | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/gsap-utils/SKILL.md`                                            | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/hatch-pet/SKILL.md`                                             | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/high-end-visual-design/SKILL.md`                                | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/image-to-code/SKILL.md`                                         | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/imagegen-frontend-mobile/SKILL.md`                              | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/imagegen-frontend-web/SKILL.md`                                 | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/impeccable/SKILL.md`                                            | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/industrial-brutalist-ui/SKILL.md`                               | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/make-interfaces-feel-better/SKILL.md`                           | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/minimalist-ui/SKILL.md`                                         | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/playwright/SKILL.md`                                            | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/product-lens/SKILL.md`                                          | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/ranveer-project-continuity/SKILL.md`                            | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/ranveer-typing-style/SKILL.md`                                  | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/redesign-existing-projects/SKILL.md`                            | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-best-practices/SKILL.md`                               | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-captions/SKILL.md`                                     | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-create/SKILL.md`                                       | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-docs/SKILL.md`                                         | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-interactivity/SKILL.md`                                | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-maps/SKILL.md`                                         | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-markup/SKILL.md`                                       | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-multimedia/SKILL.md`                                   | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-render/SKILL.md`                                       | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-saas/SKILL.md`                                         | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-studio/SKILL.md`                                       | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/remotion-upgrade/SKILL.md`                                      | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/scrapling-official/SKILL.md`                                    | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/stitch-design-taste/SKILL.md`                                   | Personal package; applicable/selective/conditional/deferred decision in family table above. |
| `skills/ui-ux-pro-max/SKILL.md`                                         | Personal package; applicable/selective/conditional/deferred decision in family table above. |

### Historical plugin snapshots (209 entrypoints)

| Entrypoint                                                                                                                     | Screen result                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--consolidate-memory/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--docx/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--humanizer/SKILL.md`                                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--pdf/SKILL.md`                                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--pptx/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--schedule/SKILL.md`                                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--setup-cowork/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--skill-creator/SKILL.md`                                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/claude-cowork--anthropic-skills--1.0.0--xlsx/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-bundled--computer-use--26.1002.51308--computer-use/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-bundled--visualize--1.0.46--visualize/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-bundled--visualize--1.0.47--visualize/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--circleci--d6169bef--builds/SKILL.md`                                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--circleci--d6169bef--chunk/SKILL.md`                                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--circleci--d6169bef--cli/SKILL.md`                                                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--circleci--d6169bef--config/SKILL.md`                                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--attack-path-analysis/SKILL.md`                              | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--deep-security-scan/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--finding-discovery/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--fix-finding/SKILL.md`                                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--security-diff-scan/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--security-scan/SKILL.md`                                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--threat-model/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--track-findings/SKILL.md`                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--triage-finding/SKILL.md`                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--codex-security--d6169bef--validation/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--github--d6169bef--gh-address-comments/SKILL.md`                                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--github--d6169bef--gh-fix-ci/SKILL.md`                                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--github--d6169bef--github/SKILL.md`                                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--github--d6169bef--yeet/SKILL.md`                                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--gmail--d6169bef--gmail/SKILL.md`                                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--gmail--d6169bef--gmail-inbox-triage/SKILL.md`                                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--aiq-deploy/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--aiq-research/SKILL.md`                                              | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--cuopt-user-rules/SKILL.md`                                          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--dynamo-interconnect-check/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--dynamo-router-starter/SKILL.md`                                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--nemoclaw-user-get-started/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--omniverse-cad-to-simready/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--omniverse-realtime-viewer/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--omniverse-usd-performance-tuning/SKILL.md`                          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--physical-ai-infrastructure-setup-and-resilient-scaling/SKILL.md`    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--nvidia--d6169bef--physical-ai-neural-reconstruction/SKILL.md`                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--supabase--d6169bef--supabase/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--supabase--d6169bef--supabase-postgres-best-practices/SKILL.md`                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--agent-browser/SKILL.md`                                             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--agent-browser-verify/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--ai-elements/SKILL.md`                                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--ai-gateway/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--ai-generation-persistence/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--ai-sdk/SKILL.md`                                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--auth/SKILL.md`                                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--bootstrap/SKILL.md`                                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--chat-sdk/SKILL.md`                                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--cms/SKILL.md`                                                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--cron-jobs/SKILL.md`                                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--deployments-cicd/SKILL.md`                                          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--email/SKILL.md`                                                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--env-vars/SKILL.md`                                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--geist/SKILL.md`                                                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--geistdocs/SKILL.md`                                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--investigation-mode/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--json-render/SKILL.md`                                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--marketplace/SKILL.md`                                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--micro/SKILL.md`                                                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--ncc/SKILL.md`                                                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--next-forge/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--nextjs/SKILL.md`                                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--observability/SKILL.md`                                             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--payments/SKILL.md`                                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--react-best-practices/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--routing-middleware/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--runtime-cache/SKILL.md`                                             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--satori/SKILL.md`                                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--shadcn/SKILL.md`                                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--sign-in-with-vercel/SKILL.md`                                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--swr/SKILL.md`                                                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--turbopack/SKILL.md`                                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--turborepo/SKILL.md`                                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--v0-dev/SKILL.md`                                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-agent/SKILL.md`                                              | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-api/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-cli/SKILL.md`                                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-firewall/SKILL.md`                                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-flags/SKILL.md`                                              | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-functions/SKILL.md`                                          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-queues/SKILL.md`                                             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-sandbox/SKILL.md`                                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-services/SKILL.md`                                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--vercel-storage/SKILL.md`                                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--verification/SKILL.md`                                              | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated--vercel--d6169bef--workflow/SKILL.md`                                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--assess-patch-risk/SKILL.md`                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--attack-path-analysis/SKILL.md`                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--deep-security-scan/SKILL.md`                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--define-security-policy/SKILL.md`                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--finding-discovery/SKILL.md`                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--fix-finding/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--propose-security-hardening/SKILL.md`                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--security-diff-scan/SKILL.md`                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--security-scan/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--threat-model/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--track-findings/SKILL.md`                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--triage-finding/SKILL.md`                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--validation/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--verify-fix/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.31--vulnerability-writeup/SKILL.md`                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--assess-patch-risk/SKILL.md`                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--attack-path-analysis/SKILL.md`                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--deep-security-scan/SKILL.md`                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--define-security-policy/SKILL.md`                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--finding-discovery/SKILL.md`                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--fix-finding/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--propose-security-hardening/SKILL.md`                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--security-diff-scan/SKILL.md`                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--security-scan/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--threat-model/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--track-findings/SKILL.md`                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--triage-finding/SKILL.md`                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--validation/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--verify-fix/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--codex-security--0.1.32--vulnerability-writeup/SKILL.md`                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--arabic-rtl-director/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--brand-activation/SKILL.md`                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--brand-intelligence/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--campaign-canon/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--campaign-dna/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--composition-director/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--creative-director/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--creative-strategy/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--designly-director/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--edit-sanitizer/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--insight-mining/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--manipulation-director/SKILL.md`                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--photography-director/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--prompt-compiler/SKILL.md`                                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--reference-memory/SKILL.md`                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--taste-engine/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--typography-director/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--visual-qa/SKILL.md`                                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--designly--4.4.0--visual-storytelling/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--google-drive--0.1.16--google-docs/SKILL.md`                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--google-drive--0.1.16--google-drive/SKILL.md`                                   | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--google-drive--0.1.16--google-drive-comments/SKILL.md`                          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--google-drive--0.1.16--google-sheets/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--google-drive--0.1.16--google-slides/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hostinger-connector--0.1.0--domains/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hostinger-connector--0.1.0--ecommerce/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hostinger-connector--0.1.0--email-marketing/SKILL.md`                          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hostinger-connector--0.1.0--hostinger/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hostinger-connector--0.1.0--subscriptions-and-payments/SKILL.md`               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hostinger-connector--0.1.0--vps/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hostinger-connector--0.1.0--websites/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hyperframes--0.1.2--gsap/SKILL.md`                                             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hyperframes--0.1.2--hyperframes/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hyperframes--0.1.2--hyperframes-cli/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hyperframes--0.1.2--hyperframes-registry/SKILL.md`                             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--hyperframes--0.1.2--website-to-hyperframes/SKILL.md`                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-analytics-dashboard/SKILL.md`       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-business-review/SKILL.md`           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-design-report/SKILL.md`             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-experiment-analysis/SKILL.md`       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-financial-budget/SKILL.md`          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-investment-committee-memo/SKILL.md` | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-legal-memorandum/SKILL.md`          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-market-trends-report/SKILL.md`      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-minimal-letterhead/SKILL.md`        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-operating-calendar/SKILL.md`        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-operating-review/SKILL.md`          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-project-kickoff/SKILL.md`           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-project-tracker/SKILL.md`           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-sales-pipeline/SKILL.md`            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-simple-dark-mode/SKILL.md`          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-simple-light-mode/SKILL.md`         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-strategy-memorandum/SKILL.md`       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-system-design/SKILL.md`             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-team-alignment/SKILL.md`            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--openai-templates--0.1.1--artifact-template-three-statement-forecast/SKILL.md`  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--pages--0.1.20--maintain-space/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--pages--0.1.20--manage-schedules/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--pages--0.1.20--organize-space/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--pages--0.1.20--write-page/SKILL.md`                                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--plugin-management--0.1.0--plugin-management/SKILL.md`                          | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--audit/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--design-qa/SKILL.md`                                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--get-context/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--ideate/SKILL.md`                                       | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--image-to-code/SKILL.md`                                | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--index/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--research/SKILL.md`                                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--share/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--url-to-code/SKILL.md`                                  | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--product-design--0.1.56--user-context/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--sites--0.1.75--sites-building/SKILL.md`                                        | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--sites--0.1.75--sites-hosting/SKILL.md`                                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--sites--0.1.75--sites-mcp/SKILL.md`                                             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--sites--0.1.75--sites-preview-troubleshooting/SKILL.md`                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--supabase--1.0.0--supabase/SKILL.md`                                            | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--supabase--1.0.0--supabase-postgres-best-practices/SKILL.md`                    | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--superdesign--0.6.0--superdesign/SKILL.md`                                      | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--work-pets--0.1.6--create-pet/SKILL.md`                                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--work-pets--0.1.6--pets/SKILL.md`                                               | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-curated-remote--work-pets--0.1.6--update-pet/SKILL.md`                                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-primary-runtime--documents--26.1005.12141--documents/SKILL.md`                                 | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-primary-runtime--pdf--26.1005.12141--pdf/SKILL.md`                                             | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-primary-runtime--presentations--26.1005.12141--presentations/SKILL.md`                         | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-primary-runtime--spreadsheets--26.1005.12141--excel-live-control/SKILL.md`                     | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-primary-runtime--spreadsheets--26.1005.12141--spreadsheets/SKILL.md`                           | Historical reference; prefer current managed equivalent; family applicability above. |
| `plugin-reference-skills/openai-primary-runtime--template-creator--26.1005.12141--template-creator/SKILL.md`                   | Historical reference; prefer current managed equivalent; family applicability above. |

### Historical service integrations (2 entrypoints)

| Entrypoint                                        | Screen result                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `reference-only-skills/codebase-memory/SKILL.md`  | Historical service; defer. Use local continuity; preserve current provider/runtime. |
| `reference-only-skills/freellmapi-codex/SKILL.md` | Historical service; defer. Use local continuity; preserve current provider/runtime. |

## Historical package-family counts

| Family                                       | Entrypoints |
| -------------------------------------------- | ----------- |
| `claude-cowork--anthropic-skills`            | 9           |
| `openai-bundled--computer-use`               | 1           |
| `openai-bundled--visualize`                  | 2           |
| `openai-curated--circleci`                   | 4           |
| `openai-curated--codex-security`             | 10          |
| `openai-curated--github`                     | 4           |
| `openai-curated--gmail`                      | 2           |
| `openai-curated--nvidia`                     | 11          |
| `openai-curated--supabase`                   | 2           |
| `openai-curated--vercel`                     | 47          |
| `openai-curated-remote--codex-security`      | 30          |
| `openai-curated-remote--designly`            | 19          |
| `openai-curated-remote--google-drive`        | 5           |
| `openai-curated-remote--hostinger-connector` | 7           |
| `openai-curated-remote--hyperframes`         | 5           |
| `openai-curated-remote--openai-templates`    | 20          |
| `openai-curated-remote--pages`               | 4           |
| `openai-curated-remote--plugin-management`   | 1           |
| `openai-curated-remote--product-design`      | 10          |
| `openai-curated-remote--sites`               | 4           |
| `openai-curated-remote--supabase`            | 2           |
| `openai-curated-remote--superdesign`         | 1           |
| `openai-curated-remote--work-pets`           | 3           |
| `openai-primary-runtime--documents`          | 1           |
| `openai-primary-runtime--pdf`                | 1           |
| `openai-primary-runtime--presentations`      | 1           |
| `openai-primary-runtime--spreadsheets`       | 2           |
| `openai-primary-runtime--template-creator`   | 1           |

## Complete ECC role inventory (71)

Every role below was screened from the installed manifest/index and exposed session descriptions. Full specialized workflows were not all invoked. Source and TOML integrity were checked for every row. Paths are relative to the canonical ECC bundle given above. Role decisions describe suitability for this patient React/TypeScript overhaul, not proof of execution.

| Role                          | Applicability                                                      | Original source                     | Codex adaptation                         |
| ----------------------------- | ------------------------------------------------------------------ | ----------------------------------- | ---------------------------------------- |
| `ecc_a11y_architect`          | Relevant review/QA lane; invoke only within assigned scope.        | `source/a11y-architect.md`          | `codex/ecc_a11y_architect.toml`          |
| `ecc_agent_evaluator`         | Supporting lane when the concrete change warrants it.              | `source/agent-evaluator.md`         | `codex/ecc_agent_evaluator.toml`         |
| `ecc_architect`               | Supporting lane when the concrete change warrants it.              | `source/architect.md`               | `codex/ecc_architect.toml`               |
| `ecc_bengali_reviewer`        | Deferred: other language/platform/domain or unrelated workflow.    | `source/bengali-reviewer.md`        | `codex/ecc_bengali_reviewer.toml`        |
| `ecc_build_error_resolver`    | Conditional; specific failure, workflow or evidence need required. | `source/build-error-resolver.md`    | `codex/ecc_build_error_resolver.toml`    |
| `ecc_chief_of_staff`          | Deferred: other language/platform/domain or unrelated workflow.    | `source/chief-of-staff.md`          | `codex/ecc_chief_of_staff.toml`          |
| `ecc_code_architect`          | Supporting lane when the concrete change warrants it.              | `source/code-architect.md`          | `codex/ecc_code_architect.toml`          |
| `ecc_code_explorer`           | Supporting lane when the concrete change warrants it.              | `source/code-explorer.md`           | `codex/ecc_code_explorer.toml`           |
| `ecc_code_reviewer`           | Relevant review/QA lane; invoke only within assigned scope.        | `source/code-reviewer.md`           | `codex/ecc_code_reviewer.toml`           |
| `ecc_code_simplifier`         | Supporting lane when the concrete change warrants it.              | `source/code-simplifier.md`         | `codex/ecc_code_simplifier.toml`         |
| `ecc_comment_analyzer`        | Supporting lane when the concrete change warrants it.              | `source/comment-analyzer.md`        | `codex/ecc_comment_analyzer.toml`        |
| `ecc_commit_reviewer`         | Supporting lane when the concrete change warrants it.              | `source/commit-reviewer.md`         | `codex/ecc_commit_reviewer.toml`         |
| `ecc_conversation_analyzer`   | Deferred: other language/platform/domain or unrelated workflow.    | `source/conversation-analyzer.md`   | `codex/ecc_conversation_analyzer.toml`   |
| `ecc_cpp_build_resolver`      | Deferred: other language/platform/domain or unrelated workflow.    | `source/cpp-build-resolver.md`      | `codex/ecc_cpp_build_resolver.toml`      |
| `ecc_cpp_reviewer`            | Deferred: other language/platform/domain or unrelated workflow.    | `source/cpp-reviewer.md`            | `codex/ecc_cpp_reviewer.toml`            |
| `ecc_csharp_reviewer`         | Deferred: other language/platform/domain or unrelated workflow.    | `source/csharp-reviewer.md`         | `codex/ecc_csharp_reviewer.toml`         |
| `ecc_dart_build_resolver`     | Deferred: other language/platform/domain or unrelated workflow.    | `source/dart-build-resolver.md`     | `codex/ecc_dart_build_resolver.toml`     |
| `ecc_database_reviewer`       | Deferred: other language/platform/domain or unrelated workflow.    | `source/database-reviewer.md`       | `codex/ecc_database_reviewer.toml`       |
| `ecc_django_build_resolver`   | Deferred: other language/platform/domain or unrelated workflow.    | `source/django-build-resolver.md`   | `codex/ecc_django_build_resolver.toml`   |
| `ecc_django_reviewer`         | Deferred: other language/platform/domain or unrelated workflow.    | `source/django-reviewer.md`         | `codex/ecc_django_reviewer.toml`         |
| `ecc_doc_updater`             | Supporting lane when the concrete change warrants it.              | `source/doc-updater.md`             | `codex/ecc_doc_updater.toml`             |
| `ecc_docs_lookup`             | Conditional; specific failure, workflow or evidence need required. | `source/docs-lookup.md`             | `codex/ecc_docs_lookup.toml`             |
| `ecc_e2e_runner`              | Relevant review/QA lane; invoke only within assigned scope.        | `source/e2e-runner.md`              | `codex/ecc_e2e_runner.toml`              |
| `ecc_fastapi_reviewer`        | Deferred: other language/platform/domain or unrelated workflow.    | `source/fastapi-reviewer.md`        | `codex/ecc_fastapi_reviewer.toml`        |
| `ecc_flutter_reviewer`        | Deferred: other language/platform/domain or unrelated workflow.    | `source/flutter-reviewer.md`        | `codex/ecc_flutter_reviewer.toml`        |
| `ecc_fsharp_reviewer`         | Deferred: other language/platform/domain or unrelated workflow.    | `source/fsharp-reviewer.md`         | `codex/ecc_fsharp_reviewer.toml`         |
| `ecc_gan_evaluator`           | Conditional; specific failure, workflow or evidence need required. | `source/gan-evaluator.md`           | `codex/ecc_gan_evaluator.toml`           |
| `ecc_gan_generator`           | Conditional; specific failure, workflow or evidence need required. | `source/gan-generator.md`           | `codex/ecc_gan_generator.toml`           |
| `ecc_gan_planner`             | Conditional; specific failure, workflow or evidence need required. | `source/gan-planner.md`             | `codex/ecc_gan_planner.toml`             |
| `ecc_go_build_resolver`       | Deferred: other language/platform/domain or unrelated workflow.    | `source/go-build-resolver.md`       | `codex/ecc_go_build_resolver.toml`       |
| `ecc_go_reviewer`             | Deferred: other language/platform/domain or unrelated workflow.    | `source/go-reviewer.md`             | `codex/ecc_go_reviewer.toml`             |
| `ecc_harmonyos_app_resolver`  | Deferred: other language/platform/domain or unrelated workflow.    | `source/harmonyos-app-resolver.md`  | `codex/ecc_harmonyos_app_resolver.toml`  |
| `ecc_harness_optimizer`       | Deferred: other language/platform/domain or unrelated workflow.    | `source/harness-optimizer.md`       | `codex/ecc_harness_optimizer.toml`       |
| `ecc_healthcare_reviewer`     | Relevant review/QA lane; invoke only within assigned scope.        | `source/healthcare-reviewer.md`     | `codex/ecc_healthcare_reviewer.toml`     |
| `ecc_homelab_architect`       | Deferred: other language/platform/domain or unrelated workflow.    | `source/homelab-architect.md`       | `codex/ecc_homelab_architect.toml`       |
| `ecc_java_build_resolver`     | Deferred: other language/platform/domain or unrelated workflow.    | `source/java-build-resolver.md`     | `codex/ecc_java_build_resolver.toml`     |
| `ecc_java_reviewer`           | Deferred: other language/platform/domain or unrelated workflow.    | `source/java-reviewer.md`           | `codex/ecc_java_reviewer.toml`           |
| `ecc_kotlin_build_resolver`   | Deferred: other language/platform/domain or unrelated workflow.    | `source/kotlin-build-resolver.md`   | `codex/ecc_kotlin_build_resolver.toml`   |
| `ecc_kotlin_reviewer`         | Deferred: other language/platform/domain or unrelated workflow.    | `source/kotlin-reviewer.md`         | `codex/ecc_kotlin_reviewer.toml`         |
| `ecc_loop_operator`           | Deferred: other language/platform/domain or unrelated workflow.    | `source/loop-operator.md`           | `codex/ecc_loop_operator.toml`           |
| `ecc_marketing_agent`         | Deferred: other language/platform/domain or unrelated workflow.    | `source/marketing-agent.md`         | `codex/ecc_marketing_agent.toml`         |
| `ecc_mle_reviewer`            | Deferred: other language/platform/domain or unrelated workflow.    | `source/mle-reviewer.md`            | `codex/ecc_mle_reviewer.toml`            |
| `ecc_network_architect`       | Deferred: other language/platform/domain or unrelated workflow.    | `source/network-architect.md`       | `codex/ecc_network_architect.toml`       |
| `ecc_network_config_reviewer` | Deferred: other language/platform/domain or unrelated workflow.    | `source/network-config-reviewer.md` | `codex/ecc_network_config_reviewer.toml` |
| `ecc_network_troubleshooter`  | Deferred: other language/platform/domain or unrelated workflow.    | `source/network-troubleshooter.md`  | `codex/ecc_network_troubleshooter.toml`  |
| `ecc_opensource_forker`       | Deferred: other language/platform/domain or unrelated workflow.    | `source/opensource-forker.md`       | `codex/ecc_opensource_forker.toml`       |
| `ecc_opensource_packager`     | Deferred: other language/platform/domain or unrelated workflow.    | `source/opensource-packager.md`     | `codex/ecc_opensource_packager.toml`     |
| `ecc_opensource_sanitizer`    | Deferred: other language/platform/domain or unrelated workflow.    | `source/opensource-sanitizer.md`    | `codex/ecc_opensource_sanitizer.toml`    |
| `ecc_performance_optimizer`   | Supporting lane when the concrete change warrants it.              | `source/performance-optimizer.md`   | `codex/ecc_performance_optimizer.toml`   |
| `ecc_php_reviewer`            | Deferred: other language/platform/domain or unrelated workflow.    | `source/php-reviewer.md`            | `codex/ecc_php_reviewer.toml`            |
| `ecc_planner`                 | Supporting lane when the concrete change warrants it.              | `source/planner.md`                 | `codex/ecc_planner.toml`                 |
| `ecc_pr_test_analyzer`        | Supporting lane when the concrete change warrants it.              | `source/pr-test-analyzer.md`        | `codex/ecc_pr_test_analyzer.toml`        |
| `ecc_python_reviewer`         | Deferred: other language/platform/domain or unrelated workflow.    | `source/python-reviewer.md`         | `codex/ecc_python_reviewer.toml`         |
| `ecc_pytorch_build_resolver`  | Deferred: other language/platform/domain or unrelated workflow.    | `source/pytorch-build-resolver.md`  | `codex/ecc_pytorch_build_resolver.toml`  |
| `ecc_rag_pipeline_reviewer`   | Deferred: other language/platform/domain or unrelated workflow.    | `source/rag-pipeline-reviewer.md`   | `codex/ecc_rag_pipeline_reviewer.toml`   |
| `ecc_react_build_resolver`    | Conditional; specific failure, workflow or evidence need required. | `source/react-build-resolver.md`    | `codex/ecc_react_build_resolver.toml`    |
| `ecc_react_reviewer`          | Relevant review/QA lane; invoke only within assigned scope.        | `source/react-reviewer.md`          | `codex/ecc_react_reviewer.toml`          |
| `ecc_refactor_cleaner`        | Conditional; specific failure, workflow or evidence need required. | `source/refactor-cleaner.md`        | `codex/ecc_refactor_cleaner.toml`        |
| `ecc_ruby_reviewer`           | Deferred: other language/platform/domain or unrelated workflow.    | `source/ruby-reviewer.md`           | `codex/ecc_ruby_reviewer.toml`           |
| `ecc_rust_build_resolver`     | Deferred: other language/platform/domain or unrelated workflow.    | `source/rust-build-resolver.md`     | `codex/ecc_rust_build_resolver.toml`     |
| `ecc_rust_reviewer`           | Deferred: other language/platform/domain or unrelated workflow.    | `source/rust-reviewer.md`           | `codex/ecc_rust_reviewer.toml`           |
| `ecc_security_reviewer`       | Supporting lane when the concrete change warrants it.              | `source/security-reviewer.md`       | `codex/ecc_security_reviewer.toml`       |
| `ecc_seo_specialist`          | Deferred: other language/platform/domain or unrelated workflow.    | `source/seo-specialist.md`          | `codex/ecc_seo_specialist.toml`          |
| `ecc_silent_failure_hunter`   | Supporting lane when the concrete change warrants it.              | `source/silent-failure-hunter.md`   | `codex/ecc_silent_failure_hunter.toml`   |
| `ecc_spec_miner`              | Conditional; specific failure, workflow or evidence need required. | `source/spec-miner.md`              | `codex/ecc_spec_miner.toml`              |
| `ecc_swift_build_resolver`    | Deferred: other language/platform/domain or unrelated workflow.    | `source/swift-build-resolver.md`    | `codex/ecc_swift_build_resolver.toml`    |
| `ecc_swift_reviewer`          | Deferred: other language/platform/domain or unrelated workflow.    | `source/swift-reviewer.md`          | `codex/ecc_swift_reviewer.toml`          |
| `ecc_tdd_guide`               | Conditional; specific failure, workflow or evidence need required. | `source/tdd-guide.md`               | `codex/ecc_tdd_guide.toml`               |
| `ecc_type_design_analyzer`    | Supporting lane when the concrete change warrants it.              | `source/type-design-analyzer.md`    | `codex/ecc_type_design_analyzer.toml`    |
| `ecc_typescript_reviewer`     | Relevant review/QA lane; invoke only within assigned scope.        | `source/typescript-reviewer.md`     | `codex/ecc_typescript_reviewer.toml`     |
| `ecc_vue_reviewer`            | Deferred: other language/platform/domain or unrelated workflow.    | `source/vue-reviewer.md`            | `codex/ecc_vue_reviewer.toml`            |

This report is an audit of available guidance. Build, browser, deployment and review claims must cite checks actually performed by the implementation owner.

## Follow-up application: UI revamp and slideshow prompt

Reused this catalog screen rather than repeating the inventory. Additional detailed readings included Awesome Design MD's Cal hierarchy/spacing reference, Genjutsu paint/cast scope and motion guidance, interface typography, Impeccable craft-floor, presentation style guidance and Designly narrative/strategy guidance. Preserved the user's chosen palette/font/flat-surface restrictions over incompatible source defaults. No full Genjutsu concept tournament, Superdesign canvas, image-generation batch or actual slide export was claimed.

Actual delegation: one routing follow-up, a writing subagent owning only HACKATHON-SLIDESHOW-PROMPT.md/.txt, and a fresh read-only ECC-informed React/TypeScript/visual reviewer. Root implemented the UI and ran browser/build/tests. User confirmed5 minutes and fewer than 6 slides, so the prompt mandates exactly 5 slides, including a60-second demo and four-person handoffs. The exported artifact is a prompt for a deck generator, not a deck.

## Follow-up application: React Bits and green patient UI

Reused the existing catalog inventory and requested a bounded read-only routing follow-up. Applied relevant guidance rather than mixing every style variant or executing unrelated skills.

- **UI/UX Pro Max**: ran the design-system search and reviewed healthcare/accessibility guidance. Rejected returned marketing/testimonial and neumorphic suggestions that contradicted the user's flat patient-workspace brief.
- **Design DNA, Awesome Design MD and Designly reference-memory/taste guidance**: retained the original patient composition, latest green-only preference and information hierarchy; gave the three requested typefaces distinct semantic roles. Existing reference inventory was reused.
- **Taste frontend UI engineering, Impeccable typeset/craft-floor and make-interfaces-feel-better**: continuous task list, consistent alignment, readable line lengths, stable focus, actual pending states and responsive controls.
- **Genjutsu paint/cast/bunshin**: coherent art direction and purposeful state motion; bounded parallel ownership for the splash and interaction components. No full concept tournament, arbitrary long-running workflow or unrelated animation stack was executed.
- **GSAP React/performance**: scoped 1.8-second opening, teardown and reduced-motion exit. Motion documentation supplied the complementary React state transitions. No double animation ownership of messages.
- **ECC frontend patterns and React/TypeScript/code review guidance**: independent read-only component/lifecycle/accessibility review, followed by correction and re-review. Concrete findings/results are recorded in VERIFICATION.md.
- **Stitch design taste**: current semantic DESIGN.md. The live Stitch attempt stopped at an unavailable workspace; no generated design is claimed.
- **Project continuity**: resumed the verified local checkpoint and will save the final revision, PR and actual checks in the local project memory directory.

Actual external tools used: official authenticated 21st CLI, CUA real-browser inspection, Git/GitHub CLI and official documentation. The 21st MCP server, paid Mobbin library, Superdesign canvas and live model/email providers were not used. Four supplied React Bits prompts were adapted to existing functionality; no new service capability is implied by their animation.
