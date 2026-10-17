# Discharge Companion — ECC inventory and architecture constraints

Collection: `/Users/macbook/Documents/Codex/SkillsCodex/agent-library/ecc/76aaa77df6adc5b889e689007bf99b9a4f74af34`
Source commit: `76aaa77df6adc5b889e689007bf99b9a4f74af34`

Verified manifest count: 71; manifest entries: 71; source Markdown: 71; Codex TOML: 71.

Classification: 20 applicable, 11 deferred, 40 irrelevant. All 71 manifest entries considered from index/metadata; full text read only where useful.

| Definition | Status | Rationale |
| --- | --- | --- |
| a11y-architect | Applicable | Semantic components, focus, contrast, reduced motion. |
| agent-evaluator | Deferred | Optional final quality scorecard; no need to block implementation. |
| architect | Applicable | Boundaries, data flow, integration decisions. |
| bengali-reviewer | Irrelevant | No Bengali-specific text processing scope. |
| build-error-resolver | Deferred | Activate if generic build/type failure occurs. |
| chief-of-staff | Irrelevant | Not a personal inbox-triage task. |
| code-architect | Applicable | Concrete frontend modules and typed adapter. |
| code-explorer | Applicable | Inspect current repo and preserve teammate decisions. |
| code-reviewer | Applicable | Independent review of actual changed code. |
| code-simplifier | Applicable | Keep feature logic small and understandable. |
| comment-analyzer | Deferred | Review when nontrivial comments exist. |
| commit-reviewer | Applicable | Review exact staged diff and short message before commit. |
| conversation-analyzer | Irrelevant | No hook generation requested. |
| cpp-build-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| cpp-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| csharp-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| dart-build-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| database-reviewer | Applicable | Review clinical record isolation and policies during integrated review. |
| django-build-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| django-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| doc-updater | Applicable | Frontend progress, integration notes, truthful launch instructions. |
| docs-lookup | Applicable | Current official documentation for version-sensitive APIs. |
| e2e-runner | Applicable | Desktop/mobile workflows, isolation and failure states. |
| fastapi-reviewer | Deferred | Activate when teammate FastAPI backend exists for integration review. |
| flutter-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| fsharp-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| gan-evaluator | Irrelevant | No GAN harness; use actual browser verification directly. |
| gan-generator | Irrelevant | No GAN harness; implementation is assigned explicitly. |
| gan-planner | Irrelevant | No GAN harness; complete product brief already supplied. |
| go-build-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| go-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| harmonyos-app-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| harness-optimizer | Irrelevant | No harness changes authorized. |
| healthcare-reviewer | Applicable | Approved-plan grounding, auditability, no invented clinical content. |
| homelab-architect | Irrelevant | No home-network design. |
| java-build-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| java-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| kotlin-build-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| kotlin-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| loop-operator | Irrelevant | No autonomous loop operation needed. |
| marketing-agent | Irrelevant | No launch campaign in current scope. |
| mle-reviewer | Irrelevant | No trained-model or MLOps pipeline. |
| network-architect | Irrelevant | No enterprise-network design. |
| network-config-reviewer | Irrelevant | No network-device configuration. |
| network-troubleshooter | Irrelevant | No diagnosed connectivity incident. |
| opensource-forker | Irrelevant | No fork/sanitized-history task authorized. |
| opensource-packager | Irrelevant | No packaging pipeline requested; write targeted project docs. |
| opensource-sanitizer | Deferred | Public release hygiene pass, without changing history. |
| performance-optimizer | Applicable | Chat scrolling, lifecycle leaks, bundle/animation cost. |
| php-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| planner | Applicable | Build and verify three coherent feature pairs. |
| pr-test-analyzer | Applicable | Behavioral coverage of permissions and persistence. |
| python-reviewer | Deferred | Activate if teammate Python code enters integrated review. |
| pytorch-build-resolver | Irrelevant | No PyTorch runtime. |
| rag-pipeline-reviewer | Deferred | Only if real document retrieval/embedding pipeline is implemented. |
| react-build-resolver | Deferred | Activate only for actual React build failures. |
| react-reviewer | Applicable | Hooks, state, component semantics, lifecycle cleanup. |
| refactor-cleaner | Deferred | Only for demonstrated unused code after feature completion. |
| ruby-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| rust-build-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| rust-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| security-reviewer | Applicable | Auth, sensitive data, files, AI context and client secrets. |
| seo-specialist | Irrelevant | Authenticated clinical app, no SEO campaign. |
| silent-failure-hunter | Applicable | Explicit save/upload/chat/handoff failure states. |
| spec-miner | Deferred | Existing substantial behavior may warrant extraction later. |
| swift-build-resolver | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| swift-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |
| tdd-guide | Deferred | Apply targeted behavior-first checks; imported 80% quota subordinate to brief. |
| type-design-analyzer | Applicable | Model mutually exclusive statuses and distinct permission domains. |
| typescript-reviewer | Applicable | Boundary validation, async correctness, strict types. |
| vue-reviewer | Irrelevant | Language/platform absent from the selected React frontend and stated backend options. |

## Guidance actually read versus work performed

- Read complete source definitions: `source/planner.md`, `source/architect.md`, `source/code-architect.md`, `source/a11y-architect.md`, `source/healthcare-reviewer.md`, `source/security-reviewer.md`, `source/react-reviewer.md`, `source/typescript-reviewer.md`.
- Read manifest/index metadata for all remaining roles; did not load their full definitions.
- Read execution brief, repository CLAUDE.md, frontend_progress.md, backend_progress.md, overlap.md, and todo.md.
- Actual task performed: one bounded inventory/architecture subagent applied the planning, architecture, healthcare/privacy/security, accessibility, React, and TypeScript perspectives. No separately launched named ECC agents, clinical/compliance approval, code review of implementation, tests, runtime verification, external messages, repo edits, pushes, or PRs performed by this subtask.
- No privacy-specific definition exists in this 71-role collection; healthcare-reviewer and security-reviewer supply that perspective.
- Source model/tool/hook recommendations are reference content; do not alter the current model, provider, permissions, or tools. Codex manifest says adaptations omit those overrides. Verify tool availability independently.

## Architecture constraints

1. Current team docs specify no chosen frontend/backend stack, endpoints, or agreed contracts. Preserve any newly discovered teammate implementation; do not treat proposed interfaces as agreed APIs. Frontend is Ranveer/Marcus; backend is Sangwoo/Sharon. Follow CLAUDE.md document ownership.
2. Use a typed data-access boundary between React features and transport. Separate real adapter from clearly labeled fictional demo adapter. Backend-unavailable states must not silently become successful mock saves. Components consume identity, capabilities, structured domain data, and Result/error states through this boundary.
3. Separate CareSpaceMembership, FamilyAccessGrant, ConversationParticipant, clinical editor/approver authority, and access-manager authority. A doctor administrating a space or Full family access does not confer private-conversation access. Basic/Support capability contents remain unconfirmed; do not invent authorization.
4. Enforce access server-side on every object, attachment URL, search, notification, and realtime channel. Client capability labels improve UX only. On membership/grant change, unsubscribe, clear unauthorized cached data and reject stale in-flight results. Identity must come from authenticated server context, not a user-supplied role selector.
5. Agree identifier formats, error shape/codes, UTC timestamps plus IANA care-space timezone, revision/version tokens, realtime event shape, request idempotency keys, and supported upload formats/size before binding transport. Do not silently settle backend architecture on behalf of teammate.
6. Domain: users, care spaces, memberships/grants, conversations/participants/messages, documents, draft/approved plan versions, sourced instructions, occurrences/reports, and handoffs. Instructions link to source passages and approved version; casual doctor messages do not alter orders.
7. Model plan approval as a protected version transition. Clinical drafts stay visibly unapproved; unknown doses/dates/thresholds require clinician clarification. Use optimistic conflict detection and preserve draft work on errors. Plan revisions affect future occurrences without rewriting historical reports.
8. Checklist occurrences distinguish actionable report, timed restriction, and appointment. Persist report actor and time, with explicit family attribution. Guard double clicks; success animation follows save success; support correction/undo with report history. Use care-space timezone for date and daylight-saving behavior.
9. Conversation sends and handoffs require stable client request IDs and idempotent server handling. Represent queued/pending/sent/failed states without claiming receipt or acknowledgement unless verified. Preserve drafts on failure. Auto-scroll only near the bottom or after own send, not while reading older messages.
10. AI runs on the server and receives only authorized, current approved plan context and relevant user-selected content. Uploaded documents are untrusted data. No invented patient-specific clinical instructions; missing coverage and service/limit failure expose Contact care team. Never store privileged keys in VITE_/public variables.
11. Handoff state machine: prepared → patient editing/approval → sending → sent, with received/acknowledged only on real signals. Show exact recipient (doctor in prototype) and editable content before sending. Cancel shares nothing; retries preserve the same operation ID.
12. Keep private content out of URL parameters, logs, analytics, and durable browser storage. Use fictional demo data only. No HIPAA/compliance or production-ready claims based on this architecture review.
13. Accessibility: semantic buttons/forms; readable dark controls on mint/blue surfaces; visible focus; keyboard dialogs with focus containment/restoration and Escape; status live regions; text plus icons; 44px preferred touch targets; reduced-motion path with static success state. Verify standards claims against current official sources if formal compliance claims are made.
14. React: stable IDs, derived state computed in render, strict discriminated domain statuses, AbortController or stale-result protection, teardown of realtime listeners and GSAP contexts. Avoid large monolithic components or speculative scaling infrastructure.
15. Build in requested pairs: home/conversations, clinician builder/checklist, then family access/handoff. Each pair needs honest pending/error/empty/populated states and targeted verification. Never infer backend isolation or persistence from screenshots.
16. Final integrated review must inspect exact fresh committed revision including backend, policies, storage, realtime, AI, env requirements. Browser evidence must include private/cross-space isolation, grant revocation, plan publication, saved report correction, failure/limit handoff, keyboard/mobile/reduced motion. Unavailable server tests remain explicitly unavailable.

## Material unknowns requiring team contract

- Backend framework/current work, auth/session transport, deployment URLs, endpoints and schema.
- Basic and Support permission matrix, contribution permissions, readable fields.
- Supported document formats, parsing service, upload size policy, source-location representation.
- Timestamp/occurrence generation rules and how plan revisions reconcile future tasks.
- Verified active-agent enumeration/clearance mechanism before any push. Local work can continue; silence cannot approve.
- No claims of live authorization, real persistence, or completed integration until those systems are supplied and exercised.
