# Plan 003: Add an aggregate `verify` script and document the build-before-test order

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If
> anything in "STOP conditions" occurs, stop and report. When done, update the
> status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- package.json CONTRIBUTING.md`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (complements 001)
- **Category**: dx
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

There is no single "is it green?" command. The working baseline is actually
`pnpm build` **then** `pnpm test` (a fresh `pnpm test` fails because workspace
packages resolve to their `dist/`), and `typecheck`/`lint` are separate manual
steps. New contributors and agents don't know this ordering, which raises the
bar for any change. One aggregate script + one line in CONTRIBUTING removes the
guesswork.

## Current state

- `package.json:9-28` scripts (relevant lines):
  ```json
  "build": "pnpm -r --filter=\"./packages/**\" --parallel run build",
  "lint": "eslint . --cache",
  "typecheck": "vue-tsc --noEmit",
  "test": "vitest test",
  ```
  There is no `verify`/`check`/`ci` aggregate script.
- CI proves the ordering: `.github/workflows/test.yml:47-51` runs `nr build`
  then `nr test` as separate steps.
- `CONTRIBUTING.md` documents `pnpm install`, `pnpm build`, `pnpm dev`,
  `pnpm demo:dev` (lines 26–68) but never states that tests need a prior build,
  nor mentions `typecheck`/`lint` as pre-PR gates.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| The new aggregate | `pnpm verify` | exit 0 (after this plan) |

## Scope

**In scope**:
- `package.json` (add one script)
- `CONTRIBUTING.md` (add a short "Before you open a PR" note)

**Out of scope**:
- CI workflow files (plan 001 wires typecheck into CI).
- Any change to the existing `build`/`test`/`lint`/`typecheck` scripts themselves.

## Git workflow

- Branch: `chore/verify-script`.
- Conventional commit: `chore: add verify script and document PR gate`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Add the `verify` script

In `package.json` scripts, add:
```json
"verify": "pnpm build && pnpm typecheck && pnpm lint && pnpm test"
```
Keep alphabetical/existing ordering conventions of the scripts block (insert
near the other lifecycle scripts).

**Verify**: `pnpm run verify --help` is not meaningful; instead run
`node -e "console.log(!!require('./package.json').scripts.verify)"` → prints `true`.

### Step 2: Run it once end-to-end

**Verify**: `pnpm install && pnpm verify` → exit 0. If `typecheck` or `lint` or
`test` surface pre-existing failures, STOP and report (do not fix unrelated
failures in this plan).

### Step 3: Document the gate in CONTRIBUTING.md

Under the existing "Development" section, add a short subsection, e.g.:
```markdown
### Before you open a PR

Run the full local gate:

```bash
pnpm verify   # build → typecheck → lint → test
```

Note: tests require a prior build, because workspace packages resolve to their
built `dist/`. `pnpm verify` handles this ordering for you.
```

**Verify**: `grep -n "pnpm verify" CONTRIBUTING.md` returns a match.

## Test plan

- No new unit tests. Verification is `pnpm verify` exiting 0 (Step 2).

## Done criteria

- [ ] `package.json` has a `verify` script equal to `pnpm build && pnpm typecheck && pnpm lint && pnpm test`
- [ ] `pnpm verify` exits 0 on a clean checkout
- [ ] `CONTRIBUTING.md` documents the build-before-test requirement and `pnpm verify`
- [ ] Only `package.json` and `CONTRIBUTING.md` changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `pnpm verify` fails on a step for reasons unrelated to this change
  (pre-existing lint/type/test failures) — report which step and the output.

## Maintenance notes

- If a coverage step is added later, fold it into `verify`.
- Reviewer: confirm `verify` mirrors exactly what CI does, so "green locally"
  means "green in CI".
