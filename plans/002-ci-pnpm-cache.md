# Plan 002: Cache the pnpm store in CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- .github/workflows/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

Every CI job cold-installs the full monorepo dependency tree (Vue, Vite,
Playwright, Monaco, Shiki, UnoCSS…) with no dependency cache. `test.yml` fans
this across a 3-OS matrix. Enabling `actions/setup-node`'s built-in `cache:
'pnpm'` reuses the pnpm store between runs, cutting minutes of avoidable
install time per job.

## Current state

The repo uses `@antfu/ni` (`nci`) to install. `nci` detects pnpm from
`pnpm-lock.yaml` and runs `pnpm install`. `packageManager` in `package.json:5`
is `pnpm@11.5.1`. None of these jobs set `cache:` on setup-node:

- `.github/workflows/test.yml:34-37` (test job) and its `cypress` job (`:60-62`).
- `.github/workflows/cr.yml:13-15`.
- `.github/workflows/autofix.yml:22-24`.
- `.github/workflows/smoke.yml` — its `pack` job (`:29-31`) has no cache; its
  `test` job (`:79-80`) already runs `pnpm/action-setup@v4` (but still no cache).

Canonical pattern to apply (setup-node's `cache: 'pnpm'` requires pnpm to exist
**before** setup-node runs, so add `pnpm/action-setup` first):

```yaml
- uses: actions/checkout@v6
- name: Setup pnpm
  uses: pnpm/action-setup@v4
- name: Use Node.js lts/*
  uses: actions/setup-node@v6
  with:
    node-version: lts/*
    cache: pnpm
```

`smoke.yml`'s test job at `:79-80` shows `pnpm/action-setup@v4` is already an
accepted action in this repo.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| YAML sanity | `pnpm dlx js-yaml .github/workflows/<file>.yml` | parses, no error |

(No build/test needed; this is CI config only. `node_modules` need not be installed.)

## Scope

**In scope**:
- `.github/workflows/test.yml`
- `.github/workflows/cr.yml`
- `.github/workflows/autofix.yml`
- `.github/workflows/smoke.yml`

**Out of scope**:
- `.github/workflows/release.yml` — releases are gated on human approval; do not
  touch the release pipeline in this plan.
- Any change to install commands (`nci`), Node versions, or the matrix.

## Git workflow

- Branch: `ci/cache-pnpm-store`.
- Conventional commit: `ci: cache pnpm store to speed up installs`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Add pnpm setup + cache to each in-scope job

For every job listed in Scope, ensure the steps are, in order:
`checkout` → `pnpm/action-setup@v4` → `actions/setup-node@v6` with `cache: pnpm`.
Where a job already installs `@antfu/ni` via `npm i -g @antfu/ni`, keep that step
after setup-node. For `smoke.yml`'s `pack` job, add the two setup steps; its
`test` job already has `pnpm/action-setup@v4`, so only add `cache: pnpm` to its
setup-node.

**Verify**: `pnpm dlx js-yaml .github/workflows/test.yml` (and each edited file)
parses without error.

### Step 2: Sanity-check every edited job still has an install step

Confirm each job that previously ran `nci` still does, and that `pnpm/action-setup`
appears before `actions/setup-node` in each.

**Verify**: `grep -n "pnpm/action-setup\|cache: pnpm\|setup-node" .github/workflows/*.yml`
shows, for each edited job, the action-setup line preceding the setup-node line.

## Test plan

- No unit tests — CI config. The real verification is a green CI run after
  merge (out of scope to trigger here). Locally, confirm YAML validity only.

## Done criteria

- [ ] All four in-scope workflows set `cache: pnpm` on `actions/setup-node`
- [ ] Each edited job runs `pnpm/action-setup@v4` before `actions/setup-node`
- [ ] Every edited job that installed deps before still installs them
- [ ] All edited YAML files parse without error
- [ ] `release.yml` is unchanged (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- A workflow uses a non-pnpm install path you'd have to restructure to cache.
- `pnpm/action-setup@v4` version conflicts with a pinned pnpm elsewhere in a way
  you can't resolve by reading the file.

## Maintenance notes

- If `packageManager` in `package.json` bumps pnpm major, `pnpm/action-setup@v4`
  auto-reads it — no version pin needed in the workflow.
- Reviewer: confirm no job lost its install step in the reshuffle.
