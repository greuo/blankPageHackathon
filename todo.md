# To-do

Shared list for both sides.

- Edit only your own side's section. Need something from the other side? Ask in `overlap.md`.
- Anyone can add to **Ideas**. When a side picks an idea up, it moves it into its own section.
- Format: `- [ ] task (YYYY-MM-DD, Name)`. Tick it `[x]` when done.

## Frontend

_Nothing yet._

## Backend

- [x] Pick stack (Supabase) and set up `backend/` (2026-10-17, Andrew)
- [x] Hospital access model: roles, care teams, conversations, escalations, RLS + tests (2026-10-17, Andrew)
- [x] `admin-create-user` and `escalate` edge functions (2026-10-17, Andrew)
- [x] Chatbot edge function: reply to patient messages with Claude, escalate when a human is needed (2026-10-17, Andrew)
- [x] Chatbot go-live: apply `chatbot` migration, seed notes on hosted, deploy `chat` + `escalate`, rerun tests (2026-10-17, Andrew)
- [ ] Set `ANTHROPIC_API_KEY` as an Edge Function secret on the hosted project (2026-10-17, Andrew)
- [ ] Run `chat/eval_live.ts` against Claude and tune the prompt if anything that should escalate gets answered (2026-10-17, Andrew)
- [ ] Escalation inbox query: open first, own patients (`routed_to = me`) on top (2026-10-17, Andrew)
- [ ] Try `admin-create-user` and `escalate` with real demo logins (2026-10-17, Andrew)
- [ ] Turn on leaked-password protection in Supabase Auth settings (2026-10-17, Andrew)

## Ideas

Future features and nice-to-haves, either side.

- Hospital-wide bot notes (clinic hours, phone numbers) alongside the per-patient ones (2026-10-17, Andrew)
- Stream the bot's reply token by token instead of waiting for the whole answer (2026-10-17, Andrew)
