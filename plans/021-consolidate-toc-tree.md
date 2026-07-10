# Plan 021: Consolidate the two divergent `addToTree` TOC builders

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/client/composables/useTocTree.ts packages/slidev/node/commands/export.ts packages/parser/src`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (coordinate with 022, which tests export)
- **Category**: tech-debt
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

TOC-tree nesting is implemented **twice** — once for the in-app TOC and once for
the PDF outline — over the same `TocItem` shape, and the copies have **already
drifted**: the export copy has an extra `tree[tree.length-1].titleLevel < titleLevel`
guard the client copy lacks. So the app TOC and the exported PDF outline can nest
the same deck differently, and every future TOC fix must be applied in two
places. Extracting one shared pure builder removes the divergence.

## Current state

**Client** — `packages/client/composables/useTocTree.ts:6-22`:
```ts
function addToTree(tree: TocItem[], route: SlideRoute, level = 1) {
  const titleLevel = route.meta.slide.level ?? level
  if (titleLevel && titleLevel > level && tree.length > 0) {          // ← no titleLevel comparison
    addToTree(tree[tree.length - 1].children, route, level + 1)
  }
  else {
    tree.push({ no: route.no, children: [], level, titleLevel,
      path: getSlidePath(route.meta.slide?.frontmatter?.routeAlias ?? route.no, false),
      hideInToc: Boolean(route.meta?.slide?.frontmatter?.hideInToc),
      title: route.meta?.slide?.title })
  }
}
```

**Export** — `packages/slidev/node/commands/export.ts:51-67`:
```ts
function addToTree(tree: TocItem[], info: SlideInfo, slideIndexes: Record<number, number>, level = 1) {
  const titleLevel = info.level
  if (titleLevel && titleLevel > level && tree.length > 0
      && tree[tree.length - 1].titleLevel < titleLevel) {              // ← extra guard here
    addToTree(tree[tree.length - 1].children, info, slideIndexes, level + 1)
  }
  else {
    tree.push({ no: info.index, children: [], level, titleLevel: titleLevel ?? level,
      path: String(slideIndexes[info.index + 1]),
      hideInToc: Boolean(info.frontmatter?.hideInToc), title: info.title })
  }
}
```
Differences: (a) the extra `titleLevel` comparison, (b) node source
(`SlideRoute` w/ reactive `meta` vs raw `SlideInfo`), (c) how `path`/`no` are
derived. `TocItem` is defined in `@slidev/types`. **Both** `@slidev/client` and
`@slidev/slidev` depend on `@slidev/parser` (`workspace:*`) — a good shared home.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test` | pass (incl. new builder test) |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/parser/src/` — a new pure `buildTocTree` (+ its export in `index.ts`)
- `packages/client/composables/useTocTree.ts` — call the shared builder
- `packages/slidev/node/commands/export.ts` — call the shared builder
- A unit test for `buildTocTree`

**Out of scope**:
- The active-status/`filterTree` decoration in the client (keep as thin wrappers).
- The PDF `makeOutline` serialization (keep; it consumes the tree).
- Deciding *which* nesting behavior is correct beyond "make both consistent" (see
  STOP conditions).

## Git workflow

- Branch: `refactor/shared-toc-tree`.
- Conventional commit: `refactor: share TOC tree builder between client and export`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Decide the canonical nesting rule

The two copies differ by the extra `tree[tree.length-1].titleLevel < titleLevel`
guard. **STOP and confirm** with the operator which is intended (the export guard
prevents nesting under a shallower-or-equal previous item and is the more correct
one). Default recommendation: adopt the export copy's guard as canonical.

### Step 2: Add a pure, node-agnostic `buildTocTree`

In `@slidev/parser`, add a builder parameterized over a minimal item shape so both
callers can adapt their node type to it:
```ts
export interface TocBuilderItem {
  no: number
  titleLevel?: number
  title?: string
  path: string
  hideInToc?: boolean
}
export function buildTocTree(items: TocBuilderItem[]): TocItem[] {
  const tree: TocItem[] = []
  function add(nodes: TocItem[], item: TocBuilderItem, level = 1) {
    const titleLevel = item.titleLevel ?? level
    const last = nodes[nodes.length - 1]
    if (titleLevel > level && last && last.titleLevel < titleLevel)
      add(last.children, item, level + 1)
    else
      nodes.push({ no: item.no, children: [], level, titleLevel,
        path: item.path, hideInToc: Boolean(item.hideInToc), title: item.title })
  }
  for (const item of items) add(tree, item)
  return tree
}
```
(Use the canonical rule from Step 1.)

### Step 3: Adapt the client to use it

In `useTocTree.ts`, map each titled `SlideRoute` to a `TocBuilderItem`
(`no: route.no`, `titleLevel: route.meta.slide.level`, `title`, `path` via
`getSlidePath`, `hideInToc`) and call `buildTocTree`. Keep
`getTreeWithActiveStatuses`/`filterTree` as-is on the result.

### Step 4: Adapt export to use it

In `export.ts`, replace the local `addToTree` reduce (`:562-566`) by mapping
titled `SlideInfo`s to `TocBuilderItem` (`no: info.index`,
`titleLevel: info.level`, `path: String(slideIndexes[info.index + 1])`, `title`,
`hideInToc`) and calling `buildTocTree`. Keep `makeOutline` consuming the result.

### Step 5: Test the builder

Add a colocated parser test (e.g. `packages/parser/src/toc.test.ts`) covering:
flat list, nested by increasing `titleLevel`, and the guard case (a shallower
previous item must not receive a deeper child). Use `toMatchInlineSnapshot`.

**Verify**: `pnpm build && pnpm test` → new test passes; existing parser and
export-related snapshots unchanged (if any drift, it reflects the intentional
nesting-rule unification — confirm it's the Step 1 decision, not an accident).

## Test plan

- Unit-test `buildTocTree` (pure) for flat/nested/guard cases — the single source
  of truth for nesting.
- Client and export become thin adapters; their behavior is verified by build +
  typecheck and (for export) plan 022's tests if present.

## Done criteria

- [ ] One `buildTocTree` in `@slidev/parser`, used by both client and export
- [ ] The two former `addToTree` copies are gone (no duplicated nesting logic)
- [ ] Nesting rule is consistent between app TOC and PDF outline
- [ ] `buildTocTree` is unit-tested
- [ ] `pnpm build && pnpm typecheck && pnpm test` pass
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Step 1's canonical-rule decision is unresolved.
- Unifying the rule changes an existing export/PDF-outline snapshot in a way the
  operator hasn't approved.
- `@slidev/client` cannot import the new `@slidev/parser` export without a build
  ordering problem — report the resolution/order error.

## Maintenance notes

- Future TOC nesting changes now happen in exactly one place.
- Reviewer: confirm both adapters map their node type to `TocBuilderItem`
  faithfully (especially `no`/`path` derivation, which differs by caller).
