# Plan 014: Confine deck-controlled file reads (`<<<` snippets and `src:`) to allowed roots

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`. This is a security-hardening change: keep it to code +
> tests, add no runnable exploit strings anywhere.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/syntax/snippet.ts packages/parser/src/fs.ts packages/slidev/node/vite/importGuard.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

Slidev already ships `vite/importGuard.ts`, which exists specifically to stop a
slide's *imports* from resolving **outside** `server.fs.allow`. But two other
deck-driven file-access paths bypass that boundary because they read straight
through `fs`:

1. `<<<` code-snippet includes (`syntax/snippet.ts`) resolve a deck-controlled
   path and `fs.readFileSync` it, inlining the bytes into a slide.
2. Frontmatter `src:` (`parser/src/fs.ts`) resolves a deck-controlled path and
   loads/parses it as slides.

Neither confines the resolved path. A deck obtained from an untrusted source can
therefore read arbitrary host files and render them into slides; when that deck
is served with `--remote`/`--tunnel` or built to `dist/`, the content is
disclosed to viewers — exactly the escape the import guard was added to prevent.
This plan applies the same root-containment boundary to both paths.

## Current state

**Snippet include** — `packages/slidev/node/syntax/snippet.ts:110-131`:
```ts
export function resolveSnippetImport(lineText, userRoot, slide) {
  // ...
  const dir = path.dirname(slide.source.filepath)
  const src = slash(
    filepath.startsWith('@/')
      ? path.resolve(userRoot, filepath.slice(2))
      : path.resolve(dir, filepath),   // ← no containment
  )
  // ...
  const isAFile = fs.existsSync(src) && fs.statSync(src).isFile()
  if (!isAFile) throw new Error(`Code snippet path not found: ${src}`)
  let content = fs.readFileSync(src, 'utf8')   // ← reads anything
  // ...
}
```
`resolveSnippetImport` is called from the markdown-it plugin (same file, `:170`),
which runs with a full `ResolvedSlidevOptions` (has `userRoot`, `userWorkspaceRoot`,
`roots`).

**`src:` include** — `packages/parser/src/fs.ts:104-127`:
```ts
if (slide.frontmatter.src) {
  const [rawPath, rangeRaw] = slide.frontmatter.src.split('#')
  const path = slash(
    rawPath.startsWith('/')
      ? resolve(options.userRoot, rawPath.substring(1))
      : resolve(dirname(slide.filepath), rawPath),  // ← no containment
  )
  // ... existsSync(path) then loadMarkdown(path, ...)
}
```
`load`'s `options` is `LoadRootsInfo = { roots: string[]; userRoot: string }`
(`fs.ts:29-32`). The node caller (`options.ts:25`) passes
`{ userRoot, roots: [userRoot] }`.

**Existing containment logic to reuse** — `vite/importGuard.ts:140-143`:
```ts
function isFileInRoot(root: string, filePath: string) {
  const relative = path.relative(root, filePath)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}
```
The boundary Vite/importGuard trust by default is the **workspace root**
(`userWorkspaceRoot`, computed in `resolver.ts:377`), which still permits
sibling/parent includes *within* the project while blocking escapes to `~`, `/etc`,
etc.

Existing tests: `packages/slidev/node/syntax/snippet.test.ts` (colocated) and
`test/parser.test.ts` (fixtures).

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test -- snippet` and `pnpm test -- parser` | pass, incl. new tests |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/utils.ts` (add a shared `isPathInsideRoots` helper) — or
  export/reuse `isFileInRoot` from `importGuard.ts`; pick one home and document it.
- `packages/slidev/node/syntax/snippet.ts` (confine snippet reads)
- `packages/parser/src/fs.ts` (confine `src:` reads) + `packages/parser/src/index.ts`/type
  for the new optional `allowedRoots` load option
- Tests: `packages/slidev/node/syntax/snippet.test.ts`, a helper unit test, and a
  `test/parser.test.ts` case

**Out of scope**:
- `importGuard.ts`'s own logic (leave it; optionally re-export its helper).
- Changing `@/` semantics or the snippet region/language handling.
- The dev-server endpoint auth (plans 015/017/018).

## Git workflow

- Branch: `fix/confine-deck-file-reads`.
- Conventional commit: `fix(security): confine snippet and src file reads to project roots`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Add a shared containment helper

Add to `packages/slidev/node/utils.ts` (and export):
```ts
import path from 'node:path'
export function isPathInsideRoots(filePath: string, roots: string[]): boolean {
  return roots.some((root) => {
    const rel = path.relative(root, filePath)
    return rel === '' || (!!rel && !rel.startsWith('..') && !path.isAbsolute(rel))
  })
}
```
(Equivalent to `importGuard.ts`'s `isFileInRoot`, generalized over a list. If you
prefer, export `isFileInRoot` from `importGuard.ts` and build `isPathInsideRoots`
on top — do not duplicate the predicate in three places.)

### Step 2: Confine snippet reads

In `resolveSnippetImport` (`snippet.ts`), after computing `src` and before
`fs.existsSync(src)`, reject paths outside the allowed roots. Thread the allowed
roots in from the plugin (it has `ResolvedSlidevOptions`): pass
`allowedRoots = uniq([options.userWorkspaceRoot, options.userRoot, ...options.roots])`
into `resolveSnippetImport`. Then:
```ts
if (!isPathInsideRoots(src, allowedRoots)) {
  throw new Error(`Code snippet path escapes the project root: ${src}`)
}
```
Update the one caller at `snippet.ts:170` to pass the roots.

### Step 3: Confine `src:` reads

Add an optional `allowedRoots?: string[]` to `LoadRootsInfo` (`fs.ts:29-32`). In
the `src` branch, after computing `path`, if `allowedRoots` is provided and
`!isPathInsideRoots(path, allowedRoots)`, record an error and skip the
`loadMarkdown` recursion:
```ts
if (options.allowedRoots && !isInsideRoots(path, options.allowedRoots)) {
  md.errors ??= []
  md.errors.push({ row: slide.start, message: `Imported markdown escapes the project root: ${path}` })
}
else if (!existsSync(path)) { /* existing not-found branch */ }
else { await loadMarkdown(path, rangeRaw, frontmatterOverride, /* chain */) }
```
Because `@slidev/parser` must not import from the `slidev` package, inline a tiny
containment predicate in the parser (or add it to `parser/src/utils.ts`). Then in
the node caller `options.ts:25`, pass
`allowedRoots: uniq([rootsInfo.userWorkspaceRoot, rootsInfo.userRoot])`.
Keeping `allowedRoots` **optional** preserves backward compatibility for other
`@slidev/parser` consumers (when omitted, behavior is unchanged).

### Step 4: Tests

- Helper unit test (colocate near `utils.ts` or add `utils` cases): assert
  `isPathInsideRoots('/a/b/c', ['/a'])` is `true`, `isPathInsideRoots('/x', ['/a'])`
  is `false`, and a `..`-escaping relative resolves to `false`.
- `snippet.test.ts`: add a case that a snippet path resolving inside the root
  still works, and one that an escaping path throws the new error. Use synthetic
  temp paths/roots — do NOT read real system files.
- `test/parser.test.ts`: add a case that `load(..., { allowedRoots: [<fixtureRoot>] })`
  records an "escapes the project root" error for a `src:` pointing outside the
  fixture root (construct a fixture whose `src` escapes the passed root).

**Verify**: `pnpm build && pnpm test -- snippet && pnpm test -- parser` → all
pass, including the new cases, and existing snapshots are unchanged.

## Test plan

- Unit-test the pure containment predicate (deterministic, no fs).
- Snippet: within-root still reads; escaping-root throws (regression guard for
  the arbitrary-read).
- `src:`: escaping the passed `allowedRoots` records an error instead of loading.
- Confirm the demo deck (`demo/starter`) and existing fixtures still build/parse
  (no legitimate in-project include is blocked): `pnpm build` + `pnpm test -- parser`.

## Done criteria

- [ ] One shared containment predicate exists (not duplicated three times)
- [ ] Snippet reads outside `[userWorkspaceRoot, userRoot, ...roots]` throw a clear error
- [ ] `src:` reads outside the provided `allowedRoots` record an error and are skipped
- [ ] `allowedRoots` is optional on the parser load API (backward compatible)
- [ ] New tests pass; existing snippet/parser tests and snapshots unchanged
- [ ] `pnpm build && pnpm typecheck` exit 0
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not loosen the boundary to make it pass) if:

- The repo's own `demo/**` decks or fixtures legitimately include files **outside
  the workspace root** — that would mean the chosen boundary is too tight; report
  the specific include so the boundary (or an allow-list config) can be decided.
- Threading `allowedRoots` into the parser would force `@slidev/parser` to depend
  on the `slidev` package — keep the predicate inlined in the parser instead.

## Maintenance notes

- If Slidev later exposes a user config to widen allowed roots (mirroring
  `server.fs.allow`), feed it into `allowedRoots` here so all three mechanisms
  (imports, snippets, `src:`) share one policy.
- Reviewer: confirm the boundary matches what `importGuard`/Vite already trust
  (workspace root), so this doesn't diverge into a third, inconsistent policy.
