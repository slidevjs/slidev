# Plan 022: Test the export pipeline (characterization tests for the flagship path)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/commands/export.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (unblocks 023; overlaps 009/016/021's helper tests)
- **Category**: tests
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`slidev export` (PDF/PNG/PPTX) is a flagship feature (README) implemented in a
658-line file with **zero** tests. Regressions in page-range selection, TOC
outline building, or filename handling ship undetected; CI only runs `slidev
build` in smoke, never export. Characterization tests over the *pure* helpers
give a fast safety net now (no Playwright needed) and are the prerequisite for
safely decomposing the module (plan 023).

## Current state

`packages/slidev/node/commands/export.ts` pure/near-pure helpers worth pinning:
- `getExportOptions(args, options, outFilename?)` (`:574-624`) — merges CLI args +
  deck config into an `ExportOptions`; exported already.
- `addToTree` (`:51-67`) + `makeOutline` (`:69-77`) — TOC → PDF outline string
  (module-internal; **not** currently exported). NB: plan 021 may move `addToTree`
  into `@slidev/parser` as `buildTocTree` — if 021 has landed, test the shared
  builder instead and only test `makeOutline` here.
- `parseRangeString` (from `@slidev/parser`) drives page selection at `:189` — its
  own tests are plan 009; here, assert `getExportOptions`/range interplay.
- The `gen*` render functions need Playwright + a running preview → out of scope
  for unit tests; covered by the optional smoke in Step 3.

Test patterns available: colocated `*.test.ts` with Vitest (see
`packages/slidev/node/syntax/*.test.ts`) using `describe/it/expect` and
`toMatchInlineSnapshot`.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test -- export` | new tests pass |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/commands/export.ts` — export `addToTree`/`makeOutline`
  (or import the shared builder from 021) so they're testable; no behavior change
- `packages/slidev/node/commands/export.test.ts` (create) — unit tests

**Out of scope**:
- Refactoring the `gen*` closures (plan 023).
- Browser teardown / filename confinement (plans 007/016 — their helpers may add
  their own tests; don't duplicate).
- Setting up a Playwright CI job (the optional smoke in Step 3 is local-only unless
  the operator wants it wired into CI).

## Git workflow

- Branch: `test/export-pipeline`.
- Conventional commit: `test(export): characterize export helpers`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Make the pure helpers importable

If `addToTree`/`makeOutline` are still local to `export.ts`, add `export` to them
(or, if plan 021 landed, import `buildTocTree` from `@slidev/parser`). Do not
change their logic.

### Step 2: Write characterization tests

Create `packages/slidev/node/commands/export.test.ts` covering:
- **`getExportOptions`**: given representative `args` + a fake `ResolvedSlidevOptions`
  (minimal `data.config` + `data.slides`), assert the resolved `format`, `output`
  (default `${basename(entry,'.md')}-export`), `width`/`height` from
  `canvasWidth`/`aspectRatio`, `withClicks` default for `pptx`, `range`, and
  `scale` defaults. Snapshot the returned object.
- **`makeOutline`** (and `addToTree`/`buildTocTree`): build a small tree from a
  handful of titled slides at mixed levels and snapshot the outline string
  (`path|--|title` lines), including a nested case.
- **range interplay**: assert `parseRangeString(total, range)` (imported from
  `@slidev/parser`) selects the expected pages for a couple of inputs the exporter
  relies on (e.g. `'2-3'`, `undefined`).

Keep fixtures inline/synthetic — no real rendering, no fs writes.

**Verify**: `pnpm build && pnpm test -- export` → all new tests pass.

### Step 3 (optional, local-only): a Playwright smoke

Only if the operator wants render coverage and `playwright-chromium` is available:
add a slow/opt-in test (or a `cypress`/script harness) that builds the demo,
serves it, runs `exportSlides` for a 2-slide deck to each format, and asserts the
output file exists with a plausible page count/size. Gate it so it does not run
in the default `pnpm test` (e.g. behind an env flag) unless CI is set up for
Playwright. **STOP and ask** before adding a browser dependency to the default CI.

## Test plan

- New `export.test.ts` pins `getExportOptions`, outline building, and range
  selection — the regressions most likely to slip through today.
- Optional Playwright smoke (Step 3) is the only true end-to-end; keep it opt-in.

## Done criteria

- [ ] `packages/slidev/node/commands/export.test.ts` exists and passes
- [ ] `getExportOptions`, outline building, and range selection are covered
- [ ] No behavior change to `export.ts` beyond adding `export` keywords
- [ ] Default `pnpm test` does not require Playwright/a browser
- [ ] `pnpm build && pnpm typecheck` exit 0
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Making a helper importable would require broad refactoring (it shouldn't — just
  an `export` keyword) — that means the code has drifted; report.
- The operator has not approved adding Playwright to CI (keep Step 3 local/opt-in).

## Maintenance notes

- These are characterization tests: if they fail after an intentional change,
  update the snapshot deliberately, not reflexively.
- This suite is the safety net plan 023 relies on before decomposing `exportSlides`.
- Reviewer: confirm the fake `ResolvedSlidevOptions` in tests stays minimal and
  doesn't couple tests to unrelated config.
