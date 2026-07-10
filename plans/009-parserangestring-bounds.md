# Plan 009: Add lower-bound / NaN validation to `parseRangeString`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/parser/src/utils.ts`
> On a mismatch with the excerpt below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`parseRangeString` filters only the **upper** bound (`i <= total`). A malformed
range fragment can yield index `0` or negative indices: `"0"` passes, and
`"-3"` splits to `['', '3']` → `range(0, 4)` → `[0,1,2,3]`. Index `0` then
reaches `md.slides[index - 1]` → `slides[-1]` (`undefined`, caught as a load
error) and export page ranges (`commands/export.ts:189`), producing timeouts or
confusing "slide failed to load" errors instead of a clean ignore. Clamping to
`1..total` and dropping `NaN` makes range parsing total.

## Current state

`packages/parser/src/utils.ts:10-31`:
```ts
export function parseRangeString(total: number, rangeStr?: string) {
  if (!rangeStr || rangeStr === 'all' || rangeStr === '*')
    return range(1, total + 1)
  if (rangeStr === 'none')
    return []

  const indexes: number[] = []
  for (const part of rangeStr.split(/[,;]/g)) {
    if (!part.includes('-')) {
      indexes.push(+part)
    }
    else {
      const [start, end] = part.split('-', 2)
      indexes.push(
        ...range(+start, !end ? (total + 1) : (+end + 1)),
      )
    }
  }

  return uniq(indexes).filter(i => i <= total).sort((a, b) => a - b)
}
```
`range` is `@antfu/utils`' `range`. Consumers: `parser/src/fs.ts:81` (slide
`src` ranges) and `commands/export.ts:189` (export page selection).

There is no colocated test for `utils.ts` today; the sibling
`packages/parser/src/timesplit/timesplit.test.ts` shows the colocated Vitest +
`toMatchInlineSnapshot` pattern.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test (parser) | `pnpm test -- utils` | new test passes |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/parser/src/utils.ts` (tighten the final filter)
- `packages/parser/src/utils.test.ts` (create)

**Out of scope**:
- `parseAspectRatio` in the same file (leave it).
- Circular-import handling (plan 008).

## Git workflow

- Branch: `fix/parse-range-bounds`.
- Conventional commit: `fix(parser): clamp parseRangeString to valid slide indices`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Tighten the final filter

Replace the return line so it drops `NaN` and enforces a lower bound of 1:
```ts
return uniq(indexes)
  .filter(i => Number.isInteger(i) && i >= 1 && i <= total)
  .sort((a, b) => a - b)
```

**Verify**: reading the function, `"0"`, `"-3"`, and `"abc"` can no longer
contribute an index `< 1` or `NaN`.

### Step 2: Add a colocated test

Create `packages/parser/src/utils.test.ts`, modeled on
`packages/parser/src/timesplit/timesplit.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { parseRangeString } from './utils'

describe('parseRangeString', () => {
  it('returns all when empty/all/*', () => {
    expect(parseRangeString(3)).toEqual([1, 2, 3])
    expect(parseRangeString(3, 'all')).toEqual([1, 2, 3])
    expect(parseRangeString(3, '*')).toEqual([1, 2, 3])
  })
  it('returns none for "none"', () => {
    expect(parseRangeString(3, 'none')).toEqual([])
  })
  it('parses lists and ranges', () => {
    expect(parseRangeString(8, '1,3-5,8')).toEqual([1, 3, 4, 5, 8])
  })
  it('clamps out-of-range and drops invalid parts', () => {
    expect(parseRangeString(5, '0')).toEqual([])
    expect(parseRangeString(5, '-3')).toEqual([]) // "-3" → ['', '3'] must not leak 0
    expect(parseRangeString(5, 'abc')).toEqual([])
    expect(parseRangeString(5, '3-99')).toEqual([3, 4, 5])
  })
})
```
Confirm the expected outputs against your Step 1 implementation before finalizing
(especially the `'-3'` case — assert it produces `[]`, i.e. no `0`, given the
current `split('-')` behavior).

**Verify**: `pnpm build && pnpm test -- utils` → all cases pass.

## Test plan

- New test file `packages/parser/src/utils.test.ts` covering: default/all/none,
  list+range parsing (the documented `1,3-5,8` example), and the bug cases
  (`0`, `-3`, `abc`, over-`total`). This is the regression guard.

## Done criteria

- [ ] `parseRangeString` never returns an index `< 1`, `> total`, or `NaN`
- [ ] `packages/parser/src/utils.test.ts` exists and passes
- [ ] The documented example `1,3-5,8` → `[1,3,4,5,8]` still holds
- [ ] `pnpm build && pnpm typecheck` exit 0
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Any existing consumer relies on `0`/negative being returned (search
  `parseRangeString` usages; none should, but confirm).

## Maintenance notes

- If negative "from-end" indexing is ever desired, do it explicitly, not via the
  current `split('-')` accident.
- Reviewer: confirm export page ranges and `src` ranges behave identically for
  valid inputs (no behavior change on the happy path).
