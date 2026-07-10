# Plan 019: Key the `getRoots()` cache by entry (fix multi-entry build/export)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/resolver.ts packages/slidev/node/resolver.test.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`getRoots()` caches its result in a module-global and returns it for **any**
subsequent call, ignoring the `entry` argument. The CLI processes multiple decks
in one process — `slidev build a/slides.md b/slides.md`, and the export /
export-notes loops — calling `resolveOptions` (→ `getRoots(entry)`) per entry. So
every deck after the first resolves its `@/…`/absolute imports, `src:` includes,
theme, and `package.json` against the **first** deck's directory: silent wrong
output for multi-entry builds/exports where the entries live in different folders.

## Current state

`packages/slidev/node/resolver.ts:356-386`:
```ts
let rootsInfo: RootsInfo | null = null

export async function getRoots(entry?: string): Promise<RootsInfo> {
  if (rootsInfo)
    return rootsInfo                         // ← ignores `entry`
  if (!entry)
    throw new Error('[slidev] Cannot find roots without entry')
  const userRoot = dirname(entry)
  isInstalledGlobally.value = /* … computed from userRoot/argv/invocationNodeModules … */
  const clientRoot = await findPkgRoot('@slidev/client', cliRoot, true)
  const closestPkgRoot = dirname(await findClosestPkgJsonPath(userRoot) || userRoot)
  const userPkgJson = await getUserPkgJson(closestPkgRoot)
  const userWorkspaceRoot = await searchForWorkspaceRoot(closestPkgRoot)
  rootsInfo = { cliRoot, clientRoot, userRoot, userPkgJson, userWorkspaceRoot }
  return rootsInfo
}
```
Callers:
- With entry: `options.ts:24` (`await getRoots(entry)`), once per deck.
- No-arg (rely on the singleton within the current deck's processing):
  `resolver.ts:258` (createResolver), `integrations/addons.ts:8`,
  `commands/export.ts:627` (importPlaywright).
- Multi-entry loops: `cli.ts:382` (build), `cli.ts:482` (export), `cli.ts:555`
  (export-notes) — each calls `resolveOptions({ entry: entryFile }, …)`.
- Test: `resolver.test.ts:83-85` primes `await getRoots('/user/project')` in
  `beforeEach`; all its cases use the same entry.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test -- resolver` | all pass |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/resolver.ts` (`getRoots` caching)

**Out of scope**:
- The no-arg call sites (they keep working via the "last roots" fallback).
- Any change to how roots are *computed* (only how they're cached).

## Git workflow

- Branch: `fix/getroots-per-entry`.
- Conventional commit: `fix(resolver): cache roots per entry for multi-deck builds`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Replace the single-slot cache with a per-entry Map + last-roots pointer

```ts
const rootsCache = new Map<string, RootsInfo>()
let lastRoots: RootsInfo | null = null

export async function getRoots(entry?: string): Promise<RootsInfo> {
  if (!entry) {
    if (lastRoots)
      return lastRoots
    throw new Error('[slidev] Cannot find roots without entry')
  }
  const cached = rootsCache.get(entry)
  if (cached) {
    lastRoots = cached
    return cached
  }
  const userRoot = dirname(entry)
  isInstalledGlobally.value = /* …unchanged… */
  const clientRoot = await findPkgRoot('@slidev/client', cliRoot, true)
  const closestPkgRoot = dirname(await findClosestPkgJsonPath(userRoot) || userRoot)
  const userPkgJson = await getUserPkgJson(closestPkgRoot)
  const userWorkspaceRoot = await searchForWorkspaceRoot(closestPkgRoot)
  const info: RootsInfo = { cliRoot, clientRoot, userRoot, userPkgJson, userWorkspaceRoot }
  rootsCache.set(entry, info)
  lastRoots = info
  return info
}
```
Rationale: the CLI processes each deck **sequentially** (resolveOptions → build/
export for one entry, then the next), so no-arg callers during a deck's
processing correctly see that deck's roots via `lastRoots`, and re-processing a
different entry recomputes instead of returning stale roots.

**Verify**: reading the function, a second `getRoots(entryB)` with a different
`entryB` returns roots whose `userRoot === dirname(entryB)`, not the first deck's.

### Step 2: Run the resolver tests

Because `resolver.test.ts` primes the same `/user/project` entry in every
`beforeEach`, the Map returns the cached value — behavior is unchanged for a
single entry.

**Verify**: `pnpm build && pnpm test -- resolver` → all existing tests pass.

### Step 3 (optional): add a multi-entry regression test

If feasible with the existing `node:fs` mock in `resolver.test.ts`, add a test
that `getRoots('/user/a/slides.md')` then `getRoots('/user/b/slides.md')` yields
distinct `userRoot`s. If the fs mock makes this awkward, skip and rely on Step 1
review + the existing suite.

## Test plan

- Existing `resolver.test.ts` must stay green (single-entry behavior unchanged).
- Optional new case: two different entries → two different `userRoot`s (the
  regression guard for the multi-entry bug).

## Done criteria

- [ ] `getRoots(entry)` returns roots computed for **that** entry, even after a prior different entry
- [ ] No-arg `getRoots()` returns the most-recently-resolved roots (throws only if none yet)
- [ ] `pnpm build && pnpm test -- resolver && pnpm typecheck` all pass
- [ ] Only `resolver.ts` (+ optional test) modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Any code path calls `getRoots()` (no-arg) **before** any `getRoots(entry)` in a
  real flow (would now throw where it previously returned the singleton) — search
  usages; the CLI always resolves an entry first, but confirm.
- Decks are ever processed **concurrently** in one process (the `lastRoots`
  pointer assumes sequential processing) — if so, roots must be threaded
  explicitly instead of via module state; report before proceeding.

## Maintenance notes

- Long-term, prefer threading `RootsInfo` explicitly to the no-arg callers rather
  than relying on `lastRoots`; this plan is the minimal fix that preserves the
  current call sites.
- Reviewer: confirm `isInstalledGlobally` is still set correctly per entry.
