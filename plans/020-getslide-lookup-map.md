# Plan 020: Replace the linear `getSlide` scan (and O(n²) TOC) with a lookup Map

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/client/logic/slides.ts packages/client/composables/useNav.ts packages/client/composables/useTocTree.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (compatible with 010)
- **Category**: perf
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`getSlide(no)` does an O(n) `Array.find` over all slides on every call. It's
called on every navigation (`useNav`) and — critically — once per titled slide
inside the TOC reducer (`useTocTree`), making TOC construction O(n²). Negligible
for a 20-slide deck, but quadratic for 200+ slide decks and on every nav change.
A precomputed `Map` keyed by slide number and by `routeAlias` makes lookups O(1).

## Current state

- `packages/client/logic/slides.ts:10-14`:
  ```ts
  export function getSlide(no: number | string) {
    return slides.value.find(
      s => (s.no === +no || s.meta.slide?.frontmatter.routeAlias === no),
    )
  }
  ```
- `slides` is a `Ref<SlideRoute[]>` from the `#slidev/slides` virtual module
  (imported at `slides.ts:4`).
- Hot callers: `packages/client/composables/useTocTree.ts:17` (inside the
  per-slide `addToTree`), and `packages/client/composables/useNav.ts` (nav paths,
  e.g. `getSlide`/`getSlidePath` around `:190`, `:291`, `:382`).
- `SlideRoute` has `.no` (number) and `.meta.slide?.frontmatter.routeAlias`.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test -- slides` (new helper test) | pass |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/client/logic/slides.ts` (add a memoized lookup; keep `getSlide` signature)
- A unit test for the pure lookup builder

**Out of scope**:
- `useNav.ts` / `useTocTree.ts` call sites (they call `getSlide` unchanged).
- The `getSlidePath` undefined-guard (plan 010) — compatible; don't undo it.

## Git workflow

- Branch: `perf/getslide-lookup-map`.
- Conventional commit: `perf(client): O(1) slide lookup by no/alias`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Extract a pure lookup builder

Add an exported pure function (testable without the virtual module):
```ts
export function buildSlideLookup(list: SlideRoute[]) {
  const byNo = new Map<number, SlideRoute>()
  const byAlias = new Map<string, SlideRoute>()
  for (const s of list) {
    byNo.set(s.no, s)
    const alias = s.meta.slide?.frontmatter.routeAlias
    if (alias != null)
      byAlias.set(String(alias), s)
  }
  return { byNo, byAlias }
}
```

### Step 2: Memoize it and route `getSlide` through it

```ts
import { computed } from 'vue'
const slideLookup = computed(() => buildSlideLookup(slides.value))

export function getSlide(no: number | string) {
  const { byNo, byAlias } = slideLookup.value
  return byNo.get(+no) ?? byAlias.get(String(no))
}
```
Preserve the original resolution precedence: number match first, then alias
(matches the old `s.no === +no || …routeAlias === no`). Note `+no` of a
non-numeric string is `NaN`, which won't match `byNo`; the alias map then handles
string aliases — same net behavior as before.

**Verify**: reading `getSlide`, results match the old predicate for (a) a numeric
`no`, (b) a string alias, (c) an unknown value (→ `undefined`).

### Step 3: Unit-test the builder

`packages/client/logic/slides.test.ts` (model after the existing
`packages/client/logic/slidePath.test.ts`): construct a couple of minimal
`SlideRoute`-shaped objects and assert `buildSlideLookup` maps by `no` and by
`routeAlias`, and that a missing key yields `undefined`.

**Verify**: `pnpm build && pnpm test -- slides` passes.

## Test plan

- Unit-test `buildSlideLookup` (pure, deterministic): by-number, by-alias, and
  missing-key cases. This is the regression guard that lookup semantics are
  preserved.
- `getSlide` itself depends on the virtual `slides` ref, so it's covered
  indirectly (the builder is the logic; `getSlide` is a thin memoized wrapper).

## Done criteria

- [ ] `getSlide` no longer does a linear `Array.find`; it uses a memoized Map
- [ ] Resolution precedence (number, then alias) is preserved
- [ ] `buildSlideLookup` is unit-tested
- [ ] TOC/nav still resolve the same slides (typecheck + existing E2E unaffected)
- [ ] `pnpm build && pnpm typecheck` exit 0
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `SlideRoute` shape differs from the excerpt (`.no`, `.meta.slide?.frontmatter.routeAlias`).
- Aliases can legitimately collide with numeric `no` values in a way the old
  `||` precedence handled differently than the Map — preserve the old order and
  note the case.

## Maintenance notes

- The `computed` recomputes only when `slides.value` changes (add/remove/reorder),
  so nav no longer rescans.
- Reviewer: confirm alias keys are stringified consistently on both write and read.
