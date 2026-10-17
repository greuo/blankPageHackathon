# blankPageHackathon

## How to contribute

`main` is protected: nobody (admins included) can push to it directly.

1. Make a branch: `git checkout -b my-feature`
2. Push it and open a PR: `git push -u origin my-feature && gh pr create --fill`
3. Two checks run on every PR:
   - **Conflict check**: warns (comment + `merge-conflict` label) if your branch conflicts with `main`, or if another open PR edits the same files. It re-runs on every open PR whenever something lands on `main`.
   - **Claude review**: Claude reviews the diff, leaves inline comments on real problems, and flags textual and semantic conflicts.
4. Merge once **Claude review** passes and there are no conflicts.

## Team docs

Claude Code sessions read and update these automatically (rules in `CLAUDE.md`):

- `backend_progress.md` / `frontend_progress.md`: current state and session log for each side. Each side only edits its own.
- `todo.md`: what's left to do on each side, plus feature ideas.
- `overlap.md`: notes for the other side (API changes, requests, questions).

## Asking Claude for help

Comment on any PR or issue with `@claude ...`. For example:

- `@claude resolve the merge conflicts`: Claude merges `main` into your branch, rewrites the conflicting code so **both** changes are kept, and pushes the result to your PR along with a summary of what it did.
- `@claude fix the issues from your review`
- `@claude why does this break the login page?`

Only collaborators with write access can trigger Claude.
