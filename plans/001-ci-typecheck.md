# Plan 001: CI type-checks the codebase on every PR

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- .github/workflows/ package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`@slidev/client` is published and consumed as **raw source** (its `package.json`
`exports` point at `.ts`/`.vue`, there is no `build` step for it), so it is
compiled inside every user's Vite project. The repo has a `typecheck` script
(`vue-tsc --noEmit`) but **no CI job runs it** — the `build` (tsdown) and Vitest
jobs do not substitute for `vue-tsc`. Type regressions in the client can merge
while CI stays green and only surface as `vue-tsc` errors in users' projects.
Adding a typecheck gate closes that hole.

## Current state

- `package.json:23` defines the script:
  ```json
  "typecheck": "vue-tsc --noEmit",
  ```
- `.github/workflows/test.yml` builds and tests but never type-checks. Its
  `test` job (lines 14–51) is the model to copy:
  ```yaml
  jobs:
    test:
      timeout-minutes: 10
      runs-on: ${{ matrix.os }}
      strategy:
        matrix:
          node-version: [lts/*]
          os: [ubuntu-latest, windows-latest, macos-latest]
        fail-fast: false
      steps:
        - uses: actions/checkout@v6
        - name: Use Node.js ${{ matrix.node-version }}
          uses: actions/setup-node@v6
          with:
            node-version: ${{ matrix.node-version }}
        - name: Setup
          run: npm i -g @antfu/ni
        - name: Install
          run: nci
          env:
            CYPRESS_INSTALL_BINARY: 0
        - name: Build
          run: nr build
        - name: Test
          run: nr test
  ```
- Convention: CI installs `@antfu/ni` then uses `nci`/`nr` wrappers. **`typecheck`
  must run after `nr build`** — several packages resolve to their built `dist/`
  via workspace links, and `vue-tsc` needs those present (the same reason `test`
  runs after `build`).

## Commands you will need

| Purpose   | Command          | Expected on success        |
|-----------|------------------|----------------------------|
| Install   | `pnpm install`   | exit 0                     |
| Build     | `pnpm build`     | exit 0                     |
| Typecheck | `pnpm typecheck` | exit 0, no type errors     |
| Lint      | `pnpm lint`      | exit 0                     |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/test.yml` (add a `typecheck` job)

**Out of scope** (do NOT touch):
- Any source `.ts`/`.vue` file. If `pnpm typecheck` reveals pre-existing type
  errors, do NOT fix them here — see STOP conditions.
- The other workflow files.

## Git workflow

- Branch: `ci/typecheck` off the base branch.
- Conventional commit, e.g. `ci: type-check on pull requests`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm the baseline is green locally

Run `pnpm install && pnpm build && pnpm typecheck`.

**Verify**: `pnpm typecheck` → exit 0. If it reports pre-existing errors, STOP
(see STOP conditions) — do not add a job that is red on day one without telling
the operator.

### Step 2: Add a `typecheck` job to `test.yml`

Append a new job named `typecheck` alongside `test` and `cypress`. It mirrors
the `test` job's setup but runs `nr typecheck` instead of `nr test`, on
`ubuntu-latest` only (types are OS-independent):

```yaml
  typecheck:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - name: Use Node.js lts/*
        uses: actions/setup-node@v6
        with:
          node-version: lts/*
      - name: Setup
        run: npm i -g @antfu/ni
      - name: Install
        run: nci
        env:
          CYPRESS_INSTALL_BINARY: 0
      - name: Build
        run: nr build
      - name: Typecheck
        run: nr typecheck
```

**Verify**: the YAML is valid — `pnpm dlx js-yaml .github/workflows/test.yml`
prints parsed YAML with no error (or use any YAML linter available).

## Test plan

- No unit tests. Verification is the workflow parsing cleanly and `pnpm build &&
  pnpm typecheck` passing locally (Step 1), which is exactly what the new job runs.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `.github/workflows/test.yml` contains a job that runs `nr typecheck` after `nr build`
- [ ] `pnpm build && pnpm typecheck` exits 0 locally
- [ ] YAML parses without error
- [ ] No files outside `.github/workflows/test.yml` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm typecheck` reports **pre-existing** type errors on the untouched base
  commit. That is a separate finding; report the errors so the operator can
  decide whether to fix them first or land the job as `continue-on-error`.
- `pnpm build` fails (this plan assumes a working build baseline).

## Maintenance notes

- If the team later splits `typecheck` per-package, keep a root aggregate so CI
  has one entrypoint.
- Reviewer should confirm the job is a required check in branch protection
  (outside the repo, so just flag it in the PR).
- Related: plan 003 adds a local `verify` script that also runs `typecheck`.
