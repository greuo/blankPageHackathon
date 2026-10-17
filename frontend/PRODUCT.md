# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
React, as requested. Vite and TypeScript selected for an isolated frontend because no app scaffold exists. Backend owned by Andrew: Supabase. Ranveer explicitly deferred backend integration until after frontend/features; the current adapter is a fictional local prototype.
## Users and purpose
A clinician builds personalized recovery companions from approved instructions. One fictional patient and family member use separate care spaces, permitted conversations, and daily reports. This visible creation workflow demonstrates the meta theme.
## Operating context
Approximately eight-hour hackathon, four teammates. Ranveer owns frontend. A reliable live demonstration and UI craft matter. No clinical effectiveness claims or real patient records.
## Confirmed constraints
Clinical drafts require clinician approval. Private chat access requires explicit participants even for administrators. Doctor and patient can manage family grants. Approved matrix: Basic nonclinical updates/joined chats; Support adds checklist/family reports; Full adds shared plan/documents. No family order editing. No caregiver scheduling or rides. Handoffs require patient approval and route to doctor.
## Product principles
Creation is visible. Provenance travels with instructions. Save/delivery states describe evidence. Fictional local demo must never imply real backend security.
## Accessibility
Keyboard, focus-managed dialogs, readable contrast, touch targets, responsive desktop/mobile, reduced motion and static status cues required.
## Open decisions
Supabase schema, session flow, storage and realtime contracts awaiting backend owner. No production medical use or server-policy verification yet.
