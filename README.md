# blankPageHackathon

A patient-only care companion. At a visit the doctor enters care notes on the patient's phone; a chatbot answers the patient's questions from those notes, flags warning signs, sends emergencies to 911, and "Send to my doctor" emails the doctor a secure link. The full idea is in [`PLAN.md`](PLAN.md).

## Start here

- What we're building and why: `PLAN.md`
- Backend (Supabase): `backend_progress.md`. "Start here: next session" lists what to build next.
- Frontend (React + Vite in `frontend/`): `frontend_progress.md`
- What's left: `todo.md`. Notes between the sides: `overlap.md`.

## How to contribute

`main` is protected: nobody (admins included) can push to it directly.

1. Make a branch: `git checkout -b my-feature`
2. Push it and open a PR: `git push -u origin my-feature && gh pr create --fill`
3. One check runs on every PR:
   - **Conflict check**: warns (comment + `merge-conflict` label) if your branch conflicts with `main`, or if another open PR edits the same files. It re-runs on every open PR whenever something lands on `main`.
4. Merge once the **Conflict check** passes and there are no conflicts.

## Team docs

Claude Code sessions read and update these automatically (rules in `CLAUDE.md`):

- `backend_progress.md` / `frontend_progress.md`: current state and session log for each side. Each side only edits its own.
- `todo.md`: what's left to do on each side, plus feature ideas.
- `overlap.md`: notes for the other side (API changes, requests, questions).

## Asking Claude for help

Comment on any PR or issue with `@claude ...`. For example:

- `@claude resolve the merge conflicts`: Claude merges `main` into your branch, rewrites the conflicting code so **both** changes are kept, and pushes the result to your PR along with a summary of what it did.
- `@claude review this PR`
- `@claude why does this break the login page?`

Only collaborators with write access can trigger Claude.
