# Plan 015: Validate client-controlled keys/paths in dev-server write sinks

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`. Security-hardening change: code + tests only, no runnable
> exploit strings.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/integrations/drawings.ts packages/slidev/node/vite/monacoWrite.ts packages/slidev/node/vite/serverRef.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S-M
- **Risk**: MED
- **Depends on**: none (complements 017/018)
- **Category**: security
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

Two dev-server write sinks derive a filesystem path from **client-controlled**
input without validating it:

1. **Drawings persistence** writes `${key}.svg` where `key` comes from the
   client-synced `drawings` server-ref state. A key containing path separators or
   `..` traverses out of the persistence directory, writing attacker-influenced
   SVG content to an arbitrary location.
2. **Monaco write-back** joins a client-supplied `file` onto `userRoot`. It is
   gated by an allow-set, but the allow-set entries are raw `<<<` paths, so a `..`
   in a declared path still escapes `userRoot`.

Combined with the unauthenticated ws (plan 017/018), a reachable client can drive
these. Validating the key/path closes the traversal regardless of auth.

## Current state

**Drawings** — `packages/slidev/node/integrations/drawings.ts:41-60`:
```ts
export async function writeDrawings(options, drawing: Record<string, string>) {
  const dir = resolveDrawingsDir(options)
  if (!dir) return
  // ...
  await fs.mkdir(dir, { recursive: true })
  return Promise.all(Object.entries(drawing).map(async ([key, value]) => {
    if (!value) return
    const svg = `${SVG_HEAD}\n${value}\n</svg>`
    await fs.writeFile(join(dir, `${key}.svg`), svg, 'utf-8')   // ← key unvalidated
  }))
}
```
`writeDrawings` is invoked from `vite/serverRef.ts:31-32` whenever the synced
`drawings` state changes (`patch ?? data`), i.e. from the client. The loader that
reads them back (`loadDrawings`, same file) keys strictly by **number**
(`const num = +basename(path, '.svg'); if (Number.isNaN(num)) return`), so valid
keys are numeric slide indices.

**Monaco write** — `packages/slidev/node/vite/monacoWrite.ts:23-32`:
```ts
if (json.type === 'custom' && json.event === 'slidev:monaco-write') {
  const { file, content } = json.data
  if (!monacoWriterWhitelist.has(file)) { /* reject */ return }
  const filepath = path.join(userRoot, file)   // ← `..` in `file` escapes userRoot
  await fs.writeFile(filepath, content, 'utf-8')
}
```
`monacoWriterWhitelist` is populated in `syntax/snippet.ts:178` with the raw
`filepath` from a `<<< … {monaco-write}` directive.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test -- drawings` (new) | pass |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/integrations/drawings.ts` (validate `key`, confine write)
- `packages/slidev/node/vite/monacoWrite.ts` (confine resolved path to `userRoot`)
- A small unit test for the drawings key/path validation

**Out of scope**:
- Adding authentication to the endpoints (plans 017/018) — this plan is
  input-validation only, valuable independently.
- Changing the drawings sync protocol or the Monaco editor UX.

## Git workflow

- Branch: `fix/devserver-write-sink-validation`.
- Conventional commit: `fix(security): validate paths in drawings/monaco write sinks`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Validate drawings keys and confine the write

In `writeDrawings`, skip any key that isn't a safe bare slide id, and assert the
final path stays inside `dir`:
```ts
const target = join(dir, `${key}.svg`)
const rel = relative(dir, target)
if (!/^\d+$/.test(key) || rel.startsWith('..') || isAbsolute(rel)) {
  console.warn(`[slidev] Ignoring drawing with unsafe key: ${key}`)
  return
}
await fs.writeFile(target, svg, 'utf-8')
```
(`relative`/`isAbsolute` from `node:path`; `join` is already imported. The
`/^\d+$/` matches the numeric keys `loadDrawings` produces.)

### Step 2: Confine the Monaco write path to `userRoot`

In `monacoWrite.ts`, after computing `filepath`, verify containment before
writing:
```ts
const filepath = path.resolve(userRoot, file)
const rel = path.relative(userRoot, filepath)
if (rel.startsWith('..') || path.isAbsolute(rel)) {
  console.error(`[slidev] Refusing monaco write outside project root: ${file}`)
  return
}
await fs.writeFile(filepath, content, 'utf-8')
```
Keep the existing `monacoWriterWhitelist` check as the first gate; this adds a
second, path-based gate. (Do not attempt to also fix the `@/` semantics of the
whitelist here — out of scope; the containment assertion is the security fix.)

**Verify**: reading both handlers, neither writes a path that can escape its
intended directory (`dir` for drawings, `userRoot` for monaco).

### Step 3: Unit-test the drawings validation

Extract the key/path check into a tiny pure helper (e.g. `isSafeDrawingKey(dir, key)`)
so it can be tested without a running server, and add
`packages/slidev/node/integrations/drawings.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { isSafeDrawingKey } from './drawings'

describe('isSafeDrawingKey', () => {
  it('accepts numeric keys', () => expect(isSafeDrawingKey('/deck/.slidev/drawings', '3')).toBe(true))
  it('rejects traversal', () => expect(isSafeDrawingKey('/deck/.slidev/drawings', '../../evil')).toBe(false))
  it('rejects separators', () => expect(isSafeDrawingKey('/deck/.slidev/drawings', 'a/b')).toBe(false))
})
```

**Verify**: `pnpm build && pnpm test -- drawings` passes.

## Test plan

- Unit-test the drawings key/path predicate (deterministic).
- Monaco containment is verified by code review + typecheck (the ws handler needs
  a live server; loader/ws testing is out of scope here).
- Confirm normal drawings persistence still round-trips: existing behavior for
  numeric keys is unchanged (the predicate accepts them).

## Done criteria

- [ ] `writeDrawings` ignores non-numeric / traversing keys and never writes outside `dir`
- [ ] `monacoWrite` refuses any path that resolves outside `userRoot`
- [ ] `isSafeDrawingKey` (or equivalent) is unit-tested
- [ ] Numeric-key drawings still persist as before
- [ ] `pnpm build && pnpm typecheck` exit 0
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Drawing keys are legitimately non-numeric in some mode (search how the client
  builds the `drawings` map) — adjust the predicate to the real safe shape rather
  than breaking persistence.
- Removing the traversal changes where valid drawings/monaco files land.

## Maintenance notes

- These are input-validation defenses; the endpoints should ALSO be
  authenticated (plans 017/018). Keep both — defense in depth.
- Reviewer: confirm the drawings predicate matches `loadDrawings`'s numeric keying
  so read/write stay symmetric.
