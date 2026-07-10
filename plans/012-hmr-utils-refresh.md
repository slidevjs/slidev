# Plan 012: Fix the no-op HMR `utils` refresh (missing `await`)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/vite/loaders.ts packages/slidev/node/options.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

On hot-update, the loader intends to refresh the derived `utils`
(`indexHtml`, `define`, `getLayouts`, katex/shiki options) after the deck data
changes. But it calls the **async** `createDataUtils` without `await`:
`Object.assign(utils, createDataUtils(options))`. `Object.assign` copies the
own-enumerable properties of a *Promise* (there are none), so the refresh does
nothing and the promise floats unhandled. It's a genuine no-op; a rejection
would surface as an unhandled promise rejection.

## Current state

- `packages/slidev/node/vite/loaders.ts:232-233`, inside the `async handleHotUpdate(ctx)`:
  ```ts
  Object.assign(data, newData)                     // works: newData is a resolved object
  Object.assign(utils, createDataUtils(options))   // no-op: createDataUtils is async
  ```
- `packages/slidev/node/options.ts:82`:
  ```ts
  export async function createDataUtils(resolved: Omit<ResolvedSlidevOptions, 'utils'>): Promise<ResolvedSlidevUtils> { ... }
  ```
- `data` and `utils` were destructured from `options` at `loaders.ts:27`
  (`const { data, mode, utils, withoutNotes } = options`), so they are the *same
  object references* as `options.data`/`options.utils`. `Object.assign(data, newData)`
  therefore updates `options.data` in place, and a subsequent
  `createDataUtils(options)` reads the fresh data.
- `handleHotUpdate` is already `async` and `await`s other work (e.g.
  `ctx.server.reloadModule` at `:262`), so awaiting here is safe.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/vite/loaders.ts` (the single line at `:233`)

**Out of scope**:
- Making the refresh *incremental*/cheaper (that's the broader HMR perf work,
  plan 024). This plan only makes the existing intended refresh actually happen.
- Any other line in `handleHotUpdate`.

## Git workflow

- Branch: `fix/hmr-utils-refresh`.
- Conventional commit: `fix(server): await utils refresh on hot update`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Await the refresh

Change `loaders.ts:233` to:
```ts
Object.assign(utils, await createDataUtils(options))
```

**Verify**: `grep -n "Object.assign(utils, await createDataUtils" packages/slidev/node/vite/loaders.ts`
returns one match; there is no remaining `Object.assign(utils, createDataUtils(options))`
without `await`.

### Step 2: Build / typecheck / lint

**Verify**: `pnpm build && pnpm typecheck && pnpm lint` exit 0.

## Test plan

- `handleHotUpdate` requires a live Vite dev server to exercise, and the loader
  has no unit harness today, so no automated test is added (loader testing is
  plan 022). The change is a one-token correctness fix; verification is
  typecheck/build plus a manual HMR sanity check if a dev deck is available
  (`pnpm demo:dev`, edit a slide, confirm no unhandled-rejection warning and the
  page updates).

## Done criteria

- [ ] `loaders.ts:233` uses `await createDataUtils(options)`
- [ ] No unawaited `Object.assign(utils, createDataUtils(...))` remains
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint` exit 0
- [ ] Only `loaders.ts` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- After awaiting, HMR noticeably regresses (each save now re-runs
  `setupShiki`/`setupKatex`/`setupIndexHtml`). If that cost is unacceptable, the
  correct answer may be to make the refresh conditional/incremental instead —
  report this so it can be folded into plan 024 rather than shipping a slow
  refresh.

## Maintenance notes

- This line re-derives all utils on every hot update. If profiling later shows it
  is hot, gate it on the specific `data` changes that actually invalidate a util
  (config/theme/features), coordinating with plan 024.
- Reviewer: confirm `options.data` is the mutated reference so the refreshed
  utils reflect the new deck.
