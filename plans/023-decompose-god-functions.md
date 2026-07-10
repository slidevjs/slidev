# Plan 023: Decompose the god functions in `export.ts` and `cli.ts`

> **Executor instructions**: This is a **behavior-preserving refactor** of two
> critical, high-churn paths. Do it in small, verifiable steps; never change what
> the code does, only how it's organized. Run the full test suite after each
> step. Honor the STOP conditions. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/commands/export.ts packages/slidev/node/cli.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: MED
- **Depends on**: **plan 022** (export characterization tests) MUST land first;
  benefits from 007 (browser teardown) and 013 already applied
- **Category**: tech-debt
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

Two functions concentrate risk and resist testing:

- `exportSlides` (`export.ts:167-572`) is a ~400-line function wrapping 13 nested
  closures (`go`, `getSlidesIndex`, `genPageWithClicks`, `genPagePdf*`,
  `genPagePng*`, `genPageMd`, `genPagePptx`, `addPdfMetadata`, `addTocToPdf`) that
  share mutable `output`/`page`/`progress` via closure. The per-format exporters
  can't be unit-tested or reused independently.
- The default serve command handler (`cli.ts:114-340`) is a ~226-line closure
  holding `initServer`, `restartServer`, tunnel/QR/open helpers, the `SHORTCUTS`
  table, `bindShortcut`, and the chokidar watcher — mixing CLI wiring, server
  lifecycle, TTY shortcuts, and file-watching.

Both are frequently edited (git churn), so the coupling compounds maintenance
cost and risk.

## Current state

- `export.ts`: `exportSlides(options)` opens a browser/context/page, dispatches on
  `format`, and all `gen*` helpers are nested functions closing over `page`,
  `output`, `progress`, `pages`, `width`, `height`, etc. (see `export.ts:167-572`).
- `cli.ts`: the `default` yargs command handler (`:114-340`) defines server
  lifecycle + shortcuts + watcher inline.
- Safety net: after plan 022, `export.ts` has characterization tests for
  `getExportOptions` + outline/range helpers. There are **no** tests for the serve
  handler (it's interactive), so its refactor must be especially conservative.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test` | all pass (incl. plan 022's) |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/commands/export.ts` (extract per-format exporters behind
  an explicit context object)
- optionally new files under `packages/slidev/node/commands/export/` for the
  extracted exporters
- `packages/slidev/node/cli.ts` (lift serve-handler helpers into a module with
  injected deps) — **only if** it can be done without behavior change

**Out of scope**:
- Any change to export output, CLI flags, shortcut keys, or server behavior.
- The public signatures of `exportSlides`/`exportNotes`/`getExportOptions` (keep
  them stable — they're imported by `build.ts` and `cli.ts`).

## Git workflow

- Branch: `refactor/decompose-export-serve`.
- One commit per extracted unit; conventional: `refactor(export): extract PngExporter`, etc.
- Do NOT push/PR unless instructed.

## Steps

> Do the **export** decomposition first (it has tests). Treat the **serve**
> handler as a second, optional phase and STOP for confirmation before starting it.

### Step 1: Introduce an explicit export context

Define an `ExportContext` object holding what the closures currently capture
(`page`, `output`, `progress`, `pages`, `width`, `height`, `withClicks`, `range`,
flags). Change `exportSlides` to build it once and pass it to the (still-nested,
for now) helpers as a parameter instead of relying on closure capture.

**Verify**: `pnpm build && pnpm test` → green; export snapshots unchanged.

### Step 2: Extract per-format exporters

Move `genPagePdf*`/`genPagePng*`/`genPageMd`/`genPagePptx` into standalone
functions (e.g. `PdfExporter(ctx)`, `PngExporter(ctx)`, …) that take the
`ExportContext`. `exportSlides` becomes: build browser/context/page → build ctx →
dispatch to the chosen exporter → (try/finally close, from plan 007). Keep
`addPdfMetadata`/`addTocToPdf`/`makeOutline`/`getSlidesIndex` as helpers the
exporters call.

**Verify after each extraction**: `pnpm build && pnpm test && pnpm typecheck` →
green; no export snapshot/behavior change.

### Step 3 (optional, STOP-gated): lift the serve handler helpers

Only after Step 2 and operator confirmation: extract `initServer`/`restartServer`/
tunnel-QR-open/`bindShortcut`/watcher into a `SlidevDevServerController` module
with injected dependencies, leaving `cli.ts` to wire args → controller. Because
there are no automated tests here, do this in the smallest possible commits and
verify manually with `pnpm demo:dev` (server starts, restart on config change,
shortcuts `o`/`e`/`q`, watcher reload).

**Verify**: `pnpm build && pnpm typecheck && pnpm lint` green; manual serve smoke
passes.

## Test plan

- Rely on plan 022's characterization tests to prove the export refactor is
  behavior-preserving — run `pnpm test` after every extraction.
- Add per-exporter unit tests where a unit becomes independently testable without
  Playwright (e.g. filename/range logic).
- Serve handler: manual smoke only (no harness); keep commits tiny.

## Done criteria

- [ ] `exportSlides` dispatches to standalone per-format exporters via an explicit context (no shared-closure mutable state for the format logic)
- [ ] Public signatures of `exportSlides`/`exportNotes`/`getExportOptions` unchanged
- [ ] All plan 022 tests still pass; export output/snapshots unchanged
- [ ] (If Step 3 done) serve behavior manually verified unchanged
- [ ] `pnpm build && pnpm typecheck && pnpm lint && pnpm test` pass
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Plan 022's tests are **not** in place — do not refactor export without the net.
- Any export snapshot/output changes — that means the refactor altered behavior;
  revert the step.
- The serve-handler extraction (Step 3) starts changing observable behavior or
  balloons in scope — stop and keep only the export decomposition.

## Maintenance notes

- After this, adding a new export format is a new exporter file, not another
  nested closure.
- Reviewer: diff should be almost entirely code movement; scrutinize any line
  that isn't a pure move.
