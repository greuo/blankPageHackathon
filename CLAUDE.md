# CLAUDE.md

Hackathon project with four people on two sides. Each person works with their own Claude Code sessions, so these docs are how sessions (and people) stay in sync.

## Team

| Person  | Side     | Git name (local machines)   |
| ------- | -------- | --------------------------- |
| Andrew  | Backend  | Andrew Joo                  |
| Sharon  | Backend  |                             |
| Ranveer | Frontend |                             |
| Marcus  | Frontend |                             |

### Work out which side you're working for

Do this before editing any of the docs below:

1. If the user said who they are or which side they're on, use that.
2. Otherwise match `git config user.name` against the table. (Cloud sessions show `Claude` here, which tells you nothing.)
3. Otherwise ask the user once. Don't guess from which code the task touches; people read and fix code on the other side too.

## Team docs

| File                   | What it's for                                                        | Who edits it                                         |
| ---------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| `backend_progress.md`  | Current state of the backend, its API, and a log of every session     | Backend sessions only                                |
| `frontend_progress.md` | Current state of the frontend, its pages, and a log of every session  | Frontend sessions only                               |
| `todo.md`              | Things to do, per side, plus feature ideas                           | Your own side's section; anyone can add ideas        |
| `overlap.md`           | Notes one side needs the other to see: API changes, requests, questions | Your own direction's section; tick/reply on the other |
| `CLAUDE.md`            | These rules                                                          | Nobody, unless the user explicitly asks              |

## At the start of a session

1. Work out your side (above).
2. Read your side's progress file, `todo.md` and `overlap.md`. Skim the other side's progress file if the task touches the API or anything shared.
3. If `overlap.md` has unticked notes addressed to your side, tell the user about them before starting.

## At the end of a session

"End of session" means: the task is done and you're about to commit/push or open a PR, or the user says they're wrapping up. Put the doc updates in the same commit/PR as the code (`main` is protected, so docs go through PRs too).

1. **Your progress file**: rewrite "Current state" so it matches reality (it's a snapshot, not a log). Add an entry at the top of "Session log".
2. **`todo.md`**: tick (`[x]`) what you finished in your side's section, add tasks you discovered, put feature ideas under "Ideas".
3. **`overlap.md`**: post anything the other side needs to know: a new or changed endpoint, a changed data shape, a new env var or port, a breaking change, a question, a request. Tick and reply to notes addressed to your side that this session dealt with.

Skip all of this if the session changed nothing (e.g. it only answered questions). Keep entries short: bullets, not paragraphs. Teammates skim these. Dates are `YYYY-MM-DD`.

## Rules

- Never edit the other side's progress file. If something in it looks wrong or affects you, post in `overlap.md`.
- In `todo.md`, don't add, tick or remove items in the other side's section. Ask through `overlap.md` instead.
- In `overlap.md`, write new notes only in your direction's section (or under "Agreed", following its rules). On the other side's notes you may only tick them and add a reply.
- When resolving merge conflicts in these docs, keep both sides' entries. They're logs, so nothing should be dropped.
- Automated runs (the PR review and `@claude` comments in GitHub Actions) skip the start and end steps above unless the comment asks for them, since there's no one to confirm the side.

## Repo workflow

- `main` is protected: every change goes through a PR. See `README.md`.
- Every PR gets a conflict check and a Claude review. Comment `@claude resolve the merge conflicts` on a PR to have conflicts fixed.
- Each side records its stack and how to run it under "Current state" in its progress file (backend: Supabase in `backend/`; frontend: React + Vite in `frontend/`).
