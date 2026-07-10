# Plan 025: Guard against `skills/` drifting from `docs/`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- skills/ scripts/ .github/workflows/`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S-M
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs / dx
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`skills/slidev/**` is an agent-facing reference **generated from `docs/`** and is
**shipped to every user** inside `@slidev/cli` (`scripts/publish.mjs:4` copies
`skills` into `packages/slidev/skills`). Its provenance is recorded in
`skills/GENERATION.md` as SHA `9d300814` / v52.11.3 — but the repo is v52.16.0
with dozens of `docs/` commits since, and the only sync mechanism is a **manual**
human checklist. So stale guidance ships to users' agents invisibly. This plan
adds an automated **drift guard**: CI fails when `docs/` has advanced past the
SHA the skills were generated from, forcing a re-sync + provenance bump. (It does
NOT auto-regenerate — that generator is a separate, larger effort.)

## Current state

- `skills/GENERATION.md` records provenance in prose:
  - `**Short SHA**: \`9d300814\`` (`:10`)
  - a version-history table (`:194-196`)
  - `Current SHA: 9d300814` (final line)
  There is no machine-readable marker and no CI check.
- `scripts/publish.mjs:4`: `await fs.copy('skills', 'packages/slidev/skills', { overwrite: true })`.
- `scripts/` already contains Node/zx scripts (e.g. `publish.mjs`,
  `update-versions.mjs`), so adding a script is idiomatic.
- CI workflows live in `.github/workflows/` (see `test.yml`).

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Run the new check | `node scripts/check-skills-drift.mjs` | exit 0 when in sync; non-zero + message when drifted |
| YAML sanity | `pnpm dlx js-yaml .github/workflows/<file>.yml` | parses |

(No build/deps needed; the script uses `git` + Node fs.)

## Scope

**In scope**:
- `skills/GENERATION.md` (add a machine-readable provenance marker)
- `scripts/check-skills-drift.mjs` (create)
- `.github/workflows/` (add a job/step that runs the check)

**Out of scope**:
- Writing the actual skills **generator** (that's a separate direction item, D2).
- Editing `skills/slidev/**` content (do not hand-edit generated files).
- Changing `publish.mjs`.

## Git workflow

- Branch: `ci/skills-drift-guard`.
- Conventional commit: `ci: fail when skills drift from docs`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Add a machine-readable provenance marker

Add a single unambiguous line to `skills/GENERATION.md` (near the top) that the
script parses, seeded with the currently-recorded SHA:
```md
<!-- skills-generated-from: 9d300814 -->
```
Keep the existing human-readable fields too; this marker is the source of truth
for the check.

### Step 2: Write `scripts/check-skills-drift.mjs`

The script:
1. Reads the marker SHA from `skills/GENERATION.md` (regex on
   `skills-generated-from:\s*([0-9a-f]+)`); error if absent.
2. Runs `git rev-list --count <sha>..HEAD -- docs/` (via `node:child_process`
   `execFileSync('git', [...])` — argv array, no shell).
3. If the count is `0`, print "skills in sync with docs" and exit `0`.
4. If `> 0`, print the list (`git diff --name-only <sha>..HEAD -- docs/`) and a
   remediation message ("Re-sync `skills/` per `skills/GENERATION.md` and update
   the `skills-generated-from` marker to the current HEAD"), then exit `1`.
   Handle the case where `<sha>` is not an ancestor (e.g. shallow CI clone):
   detect the failure of `git rev-list` and exit `0` with a warning rather than
   hard-failing CI on a fetch-depth issue.

Match the style of existing `scripts/*.mjs` (ESM, top-level await ok).

### Step 3: Wire it into CI

Add a lightweight job (or a step in an existing job) that runs
`node scripts/check-skills-drift.mjs`. Because it needs history for
`git rev-list`, set the checkout to full depth:
```yaml
  skills-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version: lts/*
      - name: Check skills/docs drift
        run: node scripts/check-skills-drift.mjs
```

**Verify**:
- Locally, `node scripts/check-skills-drift.mjs` runs and exits non-zero **today**
  (docs have advanced past `9d300814`), printing the changed docs files — that is
  the guard working. (Do NOT "fix" it by editing skills in this plan; the point is
  to surface the drift.)
- The workflow YAML parses.

## Test plan

- Manual: run the script on the current tree → it reports drift (non-zero) and
  lists changed `docs/` files. Temporarily set the marker to `HEAD`'s short SHA
  and re-run → exits `0`. Restore the real recorded SHA afterward.
- No unit test framework needed for a small CI script; the two manual runs above
  are the verification.

## Done criteria

- [ ] `skills/GENERATION.md` has a `skills-generated-from:` marker
- [ ] `scripts/check-skills-drift.mjs` exists, uses argv-based `git` (no shell), and handles the non-ancestor/shallow case gracefully
- [ ] A CI job runs the check with `fetch-depth: 0`
- [ ] Running the script locally correctly reports the current drift (non-zero)
- [ ] Workflow YAML parses
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- The team wants the guard to also **auto-regenerate** skills (that's the
  generator, direction item D2 — a separate plan; this one only detects drift).
- CI's default shallow clone can't be given full history — then base the check on
  a different signal (e.g. compare a committed hash of `docs/` tree) and report
  the approach change.

## Maintenance notes

- When skills are re-synced, bump the `skills-generated-from:` marker (and the
  human fields) to the current HEAD; the guard then goes green until docs move
  again.
- Reviewer: confirm the script fails **loudly with guidance**, not silently, and
  that it never edits generated files itself.
