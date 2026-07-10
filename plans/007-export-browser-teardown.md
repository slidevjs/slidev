# Plan 007: Guarantee Chromium teardown when an export step throws

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If
> anything in "STOP conditions" occurs, stop and report. When done, update the
> status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/commands/export.ts`
> If `export.ts` changed since this plan was written, compare the "Current
> state" excerpts against the live code; on a mismatch, treat it as a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (tests for it arrive in plan 022; not required here)
- **Category**: bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`exportSlides` and `exportNotes` launch a headless Chromium via Playwright and
call `browser.close()` **only on the happy path** — the close is not awaited and
is not in a `finally`. Any render failure (slide timeout, bad range, a
`waitFor` rejection) leaks the Chromium process for the lifetime of the parent
process. This is most damaging in `slidev build --download` and og-image
generation (`commands/build.ts` calls `exportSlides` in-process and keeps
running) and in any programmatic API use.

## Current state

- `packages/slidev/node/commands/export.ts:191-228` (`exportSlides`):
  ```ts
  const { chromium } = await importPlaywright()
  const browser = await chromium.launch({ executablePath })
  const context = await browser.newContext({ /* ... */ })
  const page = await context.newPage()
  const progress = createSlidevProgress(!perSlide)
  progress.start(pages.length)

  if (format === 'pdf') { await genPagePdf() }
  else if (format === 'png') { await genPagePng(output) }
  else if (format === 'md') { await genPageMd() }
  else if (format === 'pptx') { const buffers = await genPagePng(false); await genPagePptx(buffers) }
  else { throw new Error(`[slidev] Unsupported exporting format "${format}"`) }

  progress.stop()
  browser.close()          // ← not awaited, not in finally
  // ...
  ```
- `packages/slidev/node/commands/export.ts:130-165` (`exportNotes`): same shape —
  `const browser = await chromium.launch()` at `:131`, work in between, then
  `progress.stop(); browser.close()` at `:161-162` (also unawaited, no finally).

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/commands/export.ts`

**Out of scope**:
- The nested `gen*` closures' logic — do not change what they render.
- The page-range/output-path handling (separate plans 009/016).
- `commands/build.ts` (its own server cleanup is plan 013).

## Git workflow

- Branch: `fix/export-browser-teardown`.
- Conventional commit: `fix(export): always close browser on failure`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Wrap `exportSlides`' render body in try/finally

Between the `progress.start(...)` line and the format-dispatch block, open a
`try`; move `progress.stop()` and an **awaited** `browser.close()` into a
`finally`. Target shape:
```ts
const page = await context.newPage()
const progress = createSlidevProgress(!perSlide)
progress.start(pages.length)

try {
  if (format === 'pdf') { await genPagePdf() }
  else if (format === 'png') { await genPagePng(output) }
  else if (format === 'md') { await genPageMd() }
  else if (format === 'pptx') { const buffers = await genPagePng(false); await genPagePptx(buffers) }
  else { throw new Error(`[slidev] Unsupported exporting format "${format}"`) }
}
finally {
  progress.stop()
  await browser.close()
}

const relativeOutput = slash(relative('.', output))
return relativeOutput.startsWith('.') ? relativeOutput : `./${relativeOutput}`
```
Keep the nested function declarations (`go`, `genPage*`, etc.) exactly where they
are — they are hoisted, so the `try` can call them.

### Step 2: Do the same for `exportNotes`

Wrap the `page.goto(...) → page.pdf(...)` body (`export.ts:142-159`) in `try`,
and move `progress.stop()` + `await browser.close()` into a `finally`, returning
`output` after.

**Verify**: `grep -n "await browser.close()" packages/slidev/node/commands/export.ts`
returns **two** matches; `grep -n "finally" packages/slidev/node/commands/export.ts`
returns two matches; there is no remaining bare `browser.close()` (without
`await`).

### Step 3: Build, typecheck, lint

**Verify**: `pnpm build && pnpm typecheck && pnpm lint` all exit 0.

## Test plan

- Full export needs Playwright + a running preview, so no unit test is added
  here (the export pipeline is covered structurally by plan 022). The fix is a
  control-flow guarantee: verification is that both `browser.close()` calls are
  now `await`ed inside `finally` (Step 2 grep) and the package still builds and
  type-checks. If plan 022 has already landed, run its export smoke test and
  confirm it still passes.

## Done criteria

- [ ] Both `exportSlides` and `exportNotes` close the browser in a `finally`
- [ ] Both closes are `await browser.close()`
- [ ] No bare (unawaited) `browser.close()` remains in the file
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint` exit 0
- [ ] Only `export.ts` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- The file has been refactored (e.g. per plan 023) so the launch/close no longer
  live in one function — reconcile with the new structure and report.

## Maintenance notes

- If a browser/context pool is introduced later, the finally must close the
  right scope (context vs browser).
- Reviewer: confirm the `return` after the try/finally still runs on success and
  that `page`/`context` are owned by the same `browser` being closed.
