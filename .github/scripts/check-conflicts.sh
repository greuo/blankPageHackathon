#!/usr/bin/env bash
# Checks one open PR for merge conflicts with its base branch and for files it
# shares with other open PRs. Posts (or updates) a single warning comment and
# toggles the `merge-conflict` label. Never fails the job: GitHub already
# blocks merging a conflicting PR, this just makes the problem loud.
#
# Usage: check-conflicts.sh <pr-number>
# Needs: GH_TOKEN, GITHUB_REPOSITORY, a checkout with full history.
set -euo pipefail

PR="$1"
REPO="$GITHUB_REPOSITORY"
MARKER="<!-- conflict-check -->"
LABEL="merge-conflict"

info=$(gh pr view "$PR" --repo "$REPO" --json baseRefName,headRefName,headRepositoryOwner,state,files)
state=$(jq -r .state <<<"$info")
[ "$state" = "OPEN" ] || { echo "PR #$PR is $state, skipping"; exit 0; }

base=$(jq -r .baseRefName <<<"$info")
head=$(jq -r .headRefName <<<"$info")
mapfile -t my_files < <(jq -r '.files[].path' <<<"$info")

git fetch --quiet --no-tags origin "+refs/heads/$base:refs/remotes/origin/$base" "+refs/pull/$PR/head:refs/remotes/pr/$PR"

# --- 1. Real conflicts with the base branch --------------------------------
conflicts=""
rc=0
out=$(git merge-tree --write-tree --name-only --no-messages "origin/$base" "pr/$PR" 2>&1) || rc=$?
if [ "$rc" -eq 1 ]; then
  # Exit 1 means conflicts: first line is the tree id, the rest are the paths.
  conflicts=$(tail -n +2 <<<"$out" | sed '/^$/d')
elif [ "$rc" -ne 0 ]; then
  echo "::error::git merge-tree failed for PR #$PR: $out"
  exit 1
fi

# --- 2. Overlap with other open PRs (heads-up, not a hard conflict) ---------
overlap=""
while IFS=$'\t' read -r num title files; do
  [ "$num" = "$PR" ] && continue
  shared=$(comm -12 <(printf '%s\n' "${my_files[@]}" | sort -u) <(tr ',' '\n' <<<"$files" | sort -u) | sed '/^$/d' || true)
  if [ -n "$shared" ]; then
    overlap+="- #$num *${title}*: $(sed 's/.*/`&`/' <<<"$shared" | paste -sd, - | sed 's/,/, /g')"$'\n'
  fi
done < <(gh pr list --repo "$REPO" --state open --limit 100 --json number,title,files \
          --jq '.[] | [.number, .title, ([.files[].path] | join(","))] | @tsv')

# --- 3. Report ---------------------------------------------------------------
existing=$(gh api "repos/$REPO/issues/$PR/comments" --paginate \
  --jq ".[] | select(.body | startswith(\"$MARKER\")) | .id" | head -n1)

if [ -n "$conflicts" ]; then
  echo "::warning title=Merge conflict in PR #$PR::$(paste -sd' ' - <<<"$conflicts")"
  gh pr edit "$PR" --repo "$REPO" --add-label "$LABEL" >/dev/null || true
  body="$MARKER
## ⚠️ Merge conflict with \`$base\`

This branch (\`$head\`) can't be merged cleanly. Conflicting files:

$(sed 's/.*/- `&`/' <<<"$conflicts")

**To fix it automatically**, comment:

> @claude resolve the merge conflicts

Claude will merge \`$base\` into this branch and rewrite the conflicting code so **both** sets of changes are kept, then push the result here for you to check."
elif [ -n "$existing" ]; then
  gh pr edit "$PR" --repo "$REPO" --remove-label "$LABEL" >/dev/null 2>&1 || true
  body="$MARKER
## ✅ No merge conflicts with \`$base\`"
else
  body=""
  gh pr edit "$PR" --repo "$REPO" --remove-label "$LABEL" >/dev/null 2>&1 || true
fi

if [ -n "$overlap" ]; then
  echo "::warning title=PR #$PR overlaps other open PRs::$(paste -sd' ' - <<<"$overlap")"
  [ -z "$body" ] && body="$MARKER"
  body+="

### 👀 Heads-up: other open PRs touch the same files
Whichever merges second may hit conflicts. Coordinate with the authors:

$overlap"
fi

[ -z "$body" ] && { echo "PR #$PR: clean"; exit 0; }

if [ -n "$existing" ]; then
  gh api -X PATCH "repos/$REPO/issues/comments/$existing" -f body="$body" >/dev/null
else
  gh pr comment "$PR" --repo "$REPO" --body "$body" >/dev/null
fi
echo "PR #$PR: reported (conflicts: ${conflicts:+yes}${conflicts:-no})"
