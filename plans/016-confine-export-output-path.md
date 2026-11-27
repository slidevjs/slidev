# Plan 016: Confine the export output path derived from deck `exportFilename`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`. Security-hardening change: code + tests only.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/commands/export.ts packages/slidev/node/commands/build.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

The export output filename can come from **deck config** (`exportFilename`),
which is attacker-controlled if the deck is untrusted. It is written after only
appending an extension, so a traversing value (e.g. escaping the intended output
directory) causes `slidev export` / `slidev build --download` to write the
generated artifact outside where the operator expects. An explicit CLI
`--output` is operator-supplied and trusted; the *deck-config* fallback is what
needs constraining to a basename.

## Current state

`packages/slidev/node/commands/export.ts:603` (in `getExportOptions`):
```ts
outFilename = output || outFilename || options.data.config.exportFilename || `${path.basename(entry, '.md')}-export`
return { output: outFilename, /* ... */ }
```
Here `output` is the CLI `--output` arg (trusted) and `exportFilename` is deck
config (untrusted). The returned `output` is later written by the `gen*`
functions (`export.ts:388,417,442,498,538`) and by `commands/build.ts:149-153`:
```ts
const filename = options.data.config.exportFilename || 'slidev-exported'
await exportSlides({ port, base: config.base, ...getExportOptions(args, options, join(outDir, `${filename}.pdf`)) })
```

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test -- export` (new) | pass |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/commands/export.ts` (sanitize the deck-config filename)
- `packages/slidev/node/commands/build.ts` (sanitize the download filename)
- A small unit test for the sanitizer

**Out of scope**:
- The CLI `--output` path (operator-supplied, trusted — leave it able to target
  any directory the operator chooses).
- Browser teardown / temp-server port (plans 007/013).

## Git workflow

- Branch: `fix/confine-export-filename`.
- Conventional commit: `fix(security): treat deck exportFilename as a basename`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Add a filename sanitizer

Add a small exported helper (e.g. in `export.ts` or `node/utils.ts`):
```ts
import path from 'node:path'
// Deck-controlled filenames must not contain directory components.
export function sanitizeExportBasename(name: string): string {
  return path.basename(name)
}
```
`path.basename` strips any directory portion (`../../x` → `x`,
`/etc/foo` → `foo`), which is the correct constraint for a deck-provided name.

### Step 2: Apply to the deck-config fallback in `getExportOptions`

Only sanitize the **deck-config** source, not the CLI `--output`:
```ts
const deckName = options.data.config.exportFilename
  ? sanitizeExportBasename(options.data.config.exportFilename)
  : undefined
outFilename = output || outFilename || deckName || `${path.basename(entry, '.md')}-export`
```

### Step 3: Apply to `build.ts --download`

```ts
const filename = options.data.config.exportFilename
  ? sanitizeExportBasename(options.data.config.exportFilename)
  : 'slidev-exported'
```
(The `join(outDir, ...)` then keeps it inside `outDir`.)

### Step 4: Unit test

Add `packages/slidev/node/commands/export.test.ts` (or extend an existing test):
```ts
import { describe, expect, it } from 'vitest'
import { sanitizeExportBasename } from './export'

describe('sanitizeExportBasename', () => {
  it('keeps a plain name', () => expect(sanitizeExportBasename('talk')).toBe('talk'))
  it('strips directory traversal', () => expect(sanitizeExportBasename('../../talk')).toBe('talk'))
  it('strips absolute dirs', () => expect(sanitizeExportBasename('/etc/talk')).toBe('talk'))
})
```

**Verify**: `pnpm build && pnpm test -- export` passes.

## Test plan

- Unit-test the sanitizer (deterministic, no fs).
- Confirm a normal `exportFilename: my-talk` still yields `my-talk.pdf` in the
  expected location (no behavior change on the happy path).
- Confirm CLI `--output ./some/dir/name` still works (operator path untouched).

## Done criteria

- [ ] Deck-config `exportFilename` is reduced to a basename before use in both `export.ts` and `build.ts`
- [ ] CLI `--output` behavior is unchanged (can still target any directory)
- [ ] Sanitizer is unit-tested
- [ ] `pnpm build && pnpm typecheck` exit 0
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- A documented feature relies on `exportFilename` containing a subdirectory
  (search docs/tests) — if so, the fix should resolve-and-assert-within-outDir
  instead of basename-stripping; report before changing approach.

## Maintenance notes

- Keep the trust distinction explicit in code comments: CLI args = operator
  (trusted), deck config = untrusted.
- Reviewer: confirm no other deck-config value feeds a write path unsanitized.
