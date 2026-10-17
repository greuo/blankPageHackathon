# Frontend integration status

## Implemented locally
React/TypeScript frontend under `frontend/`; ownership proposed to Andrew and Marcus in Slack. No backend files, migrations, or workflow changes. Internal normalized view types are in `src/data/types.ts`; `src/data/repository.ts` is a fictional browser-local adapter, not an agreed backend contract. Every displayed demo record is available through browser storage/devtools. Never use real patient data here.

## Awaiting Andrew's Supabase contract
- Project public URL/publishable-key configuration and actual schema/migrations.
- Authentication/test users; authoritative user IDs, roles and space membership.
- Data/RPC/Edge Function request and response shapes, structured errors, UTC timestamps and care-space timezone.
- Approved-plan publication with immutable versions, revision preconditions and explicit approval.
- Authoritative checklist occurrence IDs and idempotent report/correction operations.
- Independent conversation participants, private storage, signed downloads, realtime filters and revocation cleanup.
- AI source citations, authorized context, unavailable/limit responses and consented handoff persistence.

Do not implement guessed table names against a real project or expose a secret/service-role key. No Supabase client is initialized until these contracts are confirmed. A live provider must replace the demo adapter, never silently fall back to it after failed network writes. Role switching is demonstration only; live mode requires authenticated sessions.

## Approved access matrix
| Capability | Basic | Support | Full |
|---|---|---|---|
| Nonclinical space updates | Yes | Yes | Yes |
| Explicitly joined conversations | Yes | Yes | Yes |
| Approved daily checklist and attributed family reports | No | Yes | Yes |
| Shared approved care plans and documents | No | No | Yes |
| Unjoined private messages or patient-only AI/handoffs | No | No | No |
| Edit/approve clinical orders or manage grants | No | No | No |

Doctor and patient can equally grant/change/revoke access with actor/old/new/time audit. Family grant and chat participation are separate. New spaces start with family access revoked until explicitly granted; a new group must explicitly select that family participant.

## Required live verification
Test direct API, database/storage policies, search/notification/realtime boundaries with separate authenticated doctor/patient/family sessions; role UI tests cannot establish server security. Confirm old subscriptions and open screens lose access after revocation. Test cross-space IDs and private attachments. These checks remain unavailable until backend integration; no backend privacy or clinical-safety certification is claimed.

## Date semantics
Demo timestamps use UTC strings and the browser's IANA timezone for entry/display and calendar occurrences. Historical checklist dates use the plan published by the end of that local date; publication changes its day and future dates. Live backend must agree an explicit care-space timezone and effective version rule, especially for DST and multiple publications on one date. Completion records remain attributed reports, not proof of an action.

## Documents and companion
Only nonempty valid UTF-8 `.txt` files with text/plain MIME, maximum 1 MiB, are read in this demo. No PDF/Word/image parsing or live AI. Text lines are manually reviewed draft instructions; supporting passages remain visible. Companion provides deterministic matching approved excerpts, explicitly not interpretations or medical advice. Uncovered requests offer patient-approved contact with the doctor. No nurse, monitoring, remote delivery, or received state is invented.

Non-Full family views use neutral shared-space labels rather than exposing free-form clinician-entered names/descriptions/categories, which could contain clinical details. Support still sees its permitted checklist wording. Explicitly joined conversations remain accessible according to their participants.
