# Claude Code GitHub bot — setup notes

Reference notes from building this in foodies-finds (#42, PRs #43-#47), kept
so setting this up in another repo doesn't require re-discovering the same
bugs by trial and error.

## What's running

- `.github/workflows/claude.yml` — responds when `@claude` is mentioned in an
  issue/PR comment, review, or issue body.
- `.github/workflows/claude-review.yml` — automatically reviews every PR on
  open/synchronize, no mention needed.

Both use `anthropics/claude-code-action@v1`.

## Adding the secret (gh CLI)

This repo authenticates via a Claude Pro/Max OAuth token, not a metered API
key, so bot usage draws from the subscription's shared quota instead of
billing per token.

```bash
# 1. Generate a token locally (opens a browser OAuth flow), while logged
#    into Claude Code with the Pro/Max account:
claude setup-token

# 2. Store it as a repo-level Actions secret. Do NOT pass the token as a
#    command-line arg (it would land in shell history) — let gh prompt for it:
gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo <owner>/<repo>
```

If billing per-token instead (e.g. a shared/high-traffic repo where the Pro
quota would compete with interactive usage), use `anthropic_api_key` /
`ANTHROPIC_API_KEY` instead of `claude_code_oauth_token` /
`CLAUDE_CODE_OAUTH_TOKEN` in both workflow files and the secret.

**Secret scope:** it must be a plain repo-level **Actions** secret (`Settings
→ Secrets and variables → Actions`, which is what `gh secret set` sets by
default). It is *not* the same thing as a GitHub Copilot "coding agent"
secret — those live in a separate store and are never visible to a plain
`.github/workflows/*.yml` job.

## Bugs hit during setup — don't reintroduce these

1. **`direct_prompt` is not a valid action input.** The current input name is
   `prompt`. Passing `direct_prompt` doesn't error — the action just logs an
   "Unexpected input(s)" warning, sets no prompt, finds no trigger, and
   reports the job as a silent success having done nothing. If a review job
   finishes suspiciously fast (~10-15s) with no comment posted, check for
   this first.

2. **Auto-review (agent/prompt mode) needs `issues: write` permission, not
   just `pull-requests: write`.** GitHub's API treats PR conversation
   comments as issue comments under the hood. Without `issues: write`, the
   job runs a full agentic session (real turns, real quota spent) but every
   attempt to post the comment is denied, and it finishes reporting success
   with nothing posted (`permission_denials_count > 0` in the run's JSON
   result — `gh run view <id> --log` and grep for it).

3. **Auto-review (agent/prompt mode) also needs `track_progress: true`.**
   Mention-triggered (`tag`) mode gets comment-posting wired up automatically;
   plain prompt-driven agent mode (`pull_request` events) does not, unless
   `track_progress: true` is set. Missing this causes the same
   "ran but posted nothing" symptom as #2 — set both together.

4. **Editing the workflow file in an open PR does not change its behavior
   on that PR.** `pull_request`-triggered workflows always execute using the
   copy of the workflow file already on the base branch (`main`), never the
   PR's own edited copy — a GitHub security guard against a PR rewriting its
   own CI checks. This means a workflow fix must be merged to `main` before
   it can be verified — pushing another commit to the same open PR and
   re-running will just repeat the old (buggy) behavior. Expect a
   merge → open new throwaway PR → check → repeat cycle when iterating on
   the workflow file itself, not a single-PR feedback loop.

## Verifying it works without repeating the above

1. Confirm the secret exists: `gh secret list --repo <owner>/<repo>`.
2. Open any PR and confirm `claude-review.yml` posts a comment (check
   `gh pr view <n> --json comments`, not `--json reviews` — it's a plain
   comment, not a formal GitHub review).
3. Comment `@claude <question>` on a PR/issue and confirm `claude.yml`
   responds.
4. If a run "succeeds" in under ~15s with nothing posted, it silently did
   nothing — check `gh run view <id> --log` for the input-name warning (#1)
   or `permission_denials_count` (#2/#3) before assuming it worked.

## Cost / billing note

The `total_cost_usd` field printed in the run's JSON result is an
informational token-cost estimate at API list price — Claude Code always
reports it, regardless of auth method. With `claude_code_oauth_token`
there's no separate charge; it just reflects how much of the Pro/Max plan's
shared rate-limit quota that run consumed. There's no published exact
conversion between the subscription price and that quota — check
claude.ai → Settings → Usage for actual current standing.
