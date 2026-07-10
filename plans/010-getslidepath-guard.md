# Plan 010: Harden `getSlidePath` against an unknown slide (drop the non-null assertion)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/client/logic/slides.ts packages/client/composables/useNav.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW-MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`getSlidePath` casts away the possibility that a slide lookup fails:
`route = getSlide(route)!`. `getSlide` returns `undefined` for an unknown slide
number or `routeAlias`, and the next call reads `route.meta`, throwing
`Cannot read properties of undefined (reading 'meta')`. This is reachable via a
deep link / stale URL / programmatic `go(no)` to a slide that doesn't exist
(e.g. an alias that was renamed). Instead of crashing navigation, it should
resolve to a sensible fallback.

## Current state

`packages/client/logic/slides.ts:10-24`:
```ts
export function getSlide(no: number | string) {
  return slides.value.find(
    s => (s.no === +no || s.meta.slide?.frontmatter.routeAlias === no),
  )
}

export function getSlidePath(
  route: SlideRoute | number | string,
  presenter: boolean,
  exporting: boolean = false,
) {
  if (typeof route === 'number' || typeof route === 'string')
    route = getSlide(route)!            // ← throws if lookup fails
  return getSlideRoutePath(route, presenter, exporting)
}
```
- `getSlideRoutePath` is imported from `./slidePath` and immediately reads
  `route.meta` (so a `undefined` route crashes there).
- Callers include `packages/client/composables/useNav.ts` (`go()` at ~`:190`,
  and `getSlidePath` at ~`:382`), and `useTocTree.ts:17`.
- `slides` comes from the virtual module `#slidev/slides`, so this function is
  hard to unit test in isolation (it is currently exercised only via E2E).
- Note: plan 020 will add a lookup Map for `getSlide`; keep this fix compatible
  by not changing `getSlide`'s signature.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 (no new `!`-related errors) |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `packages/client/logic/slides.ts`

**Out of scope**:
- `getSlide`'s implementation (plan 020 optimizes it).
- `useNav.ts` / `useTocTree.ts` call sites (this fix makes the callee safe; do
  not change callers).

## Git workflow

- Branch: `fix/get-slide-path-guard`.
- Conventional commit: `fix(client): guard getSlidePath against unknown slide`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Replace the assertion with a guarded fallback

Change `getSlidePath` so an unknown lookup falls back to the first slide rather
than throwing:
```ts
export function getSlidePath(
  route: SlideRoute | number | string,
  presenter: boolean,
  exporting: boolean = false,
) {
  if (typeof route === 'number' || typeof route === 'string') {
    const found = getSlide(route)
    if (!found) {
      console.warn(`[slidev] Unknown slide "${route}", falling back to the first slide`)
      route = slides.value[0]
    }
    else {
      route = found
    }
  }
  return getSlideRoutePath(route, presenter, exporting)
}
```
Rationale for first-slide fallback: it matches the router's existing behavior of
redirecting empty/`404` paths to `/1` (see `packages/client/setup/routes.ts:88-97`).

**Verify**: `grep -n "getSlide(route)!" packages/client/logic/slides.ts` returns
no matches.

### Step 2: Typecheck

**Verify**: `pnpm build && pnpm typecheck` exit 0. If `slides.value[0]` can be
`undefined` per the types (empty deck), guard that too (return the current path
or throw a clear, intentional error) — a deck always has ≥1 slide at runtime, so
a `slides.value[0]` access is acceptable, but keep the types honest.

## Test plan

- Because `slides` is a virtual-module ref, no isolated unit test is added here
  (consistent with the file having none today; navigation is E2E-covered by
  `cypress/e2e/examples/basic.spec.ts`). The fix is verified by: (a) the
  assertion is gone, (b) typecheck passes, (c) the fallback path is the same one
  the router already uses. If plan 020 introduces a testable `getSlide`, add a
  unit test there for the unknown-slide → fallback case.

## Done criteria

- [ ] No `getSlide(route)!` (non-null assertion) remains in `slides.ts`
- [ ] Unknown number/alias resolves to a fallback instead of throwing
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint` exit 0
- [ ] Only `slides.ts` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Callers depend on `getSlidePath` throwing for unknown slides (search usages;
  none should, but confirm) — if one does, that behavior needs its own decision.

## Maintenance notes

- If plan 020 (getSlide Map) lands first or after, ensure the fallback still uses
  whatever `getSlide` returns; don't duplicate lookup logic.
- Reviewer: confirm the warning isn't spammy on legitimate flows (it should only
  fire for genuinely unknown targets).
