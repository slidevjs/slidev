# Plan 008: Guard against circular `src:` slide imports

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If
> anything in "STOP conditions" occurs, stop and report. When done, update the
> status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/parser/src/fs.ts test/parser.test.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

A slide can pull in another Markdown file via `frontmatter.src`. The loader
threads an `importChain` but never checks it for cycles, and it re-iterates a
cached file's slides on every `loadMarkdown` call. So a deck where `a.md`
imports `b.md` which imports `a.md` (or a slide importing its own file) recurses
without bound → `RangeError: Maximum call stack size exceeded` on `dev`,
`build`, and `export`. A malicious or accidental circular deck hard-crashes the
tool; it should record an error and continue.

## Current state

`packages/parser/src/fs.ts` — `loadSlide` recurses on `src` with no cycle check:
```ts
// lines 71-99: loadMarkdown caches per path but still re-iterates slides
async function loadMarkdown(path, range?, frontmatterOverride?, importers?) {
  let md = markdownFiles[path]
  if (!md) { /* parse + cache */ }
  const directImporter = importers?.at(-1)
  for (const index of parseRangeString(md.slides.length, range)) {
    const subSlide = md.slides[index - 1]
    try { await loadSlide(md, subSlide, frontmatterOverride, importers) }
    catch (e) { /* push md.errors, continue */ }
    // ...
  }
  return md
}

// lines 101-128: the src branch — resolves and recurses, no cycle guard
async function loadSlide(md, slide, frontmatterOverride?, importChain?) {
  if (slide.frontmatter.disabled || slide.frontmatter.hide) return
  if (slide.frontmatter.src) {
    const [rawPath, rangeRaw] = slide.frontmatter.src.split('#')
    const path = slash(
      rawPath.startsWith('/')
        ? resolve(options.userRoot, rawPath.substring(1))
        : resolve(dirname(slide.filepath), rawPath),
    )
    frontmatterOverride = { ...slide.frontmatter, ...frontmatterOverride }
    delete frontmatterOverride.src
    if (!existsSync(path)) { /* push "not found" error */ }
    else {
      await loadMarkdown(path, rangeRaw, frontmatterOverride, importChain ? [...importChain, slide] : [slide])
    }
  }
  else { slides.push({ /* ... */ importChain, source: slide }) }
}
```
Key facts:
- `importChain` is the list of ancestor **source slides** that led here; each has
  a `.filepath` (confirmed by `test/parser.test.ts:43` asserting `slide.filepath`).
- Paths are `slash`-normalized and match the `markdownFiles` keys.
- A cycle exists exactly when the file we're about to load (`path`) is already an
  ancestor in `importChain`, or the slide imports its own file
  (`path === slide.filepath`).
- Errors are recorded on `md.errors` as `{ row, message }` (see the not-found
  branch just above, and the catch at `fs.ts:86-92`).

Existing test harness: `test/parser.test.ts` loads fixtures with
`load({ userRoot, roots: [userRoot] }, file)`. The generic fixture loop globs
`*.md` **non-recursively** in `test/fixtures/markdown/` (`fs.sync('*.md', { cwd: userRoot })`),
so fixtures placed in a **subdirectory** are NOT swept by that loop and can be
used in a dedicated test.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test (parser) | `pnpm test -- parser` | all pass, incl. new test |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/parser/src/fs.ts` (add the cycle guard)
- `test/parser.test.ts` (add one dedicated test)
- `test/fixtures/markdown/circular/a.md` and `.../circular/b.md` (new fixtures, in a subdir)

**Out of scope**:
- `parseRangeString` bounds (plan 009).
- Any change to caching/perf of `load` (plan 024).
- The top-level fixture snapshot loop (don't add circular fixtures at the top level).

## Git workflow

- Branch: `fix/parser-circular-src`.
- Conventional commit: `fix(parser): detect circular src imports`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Add the cycle guard in `loadSlide`

In the `if (slide.frontmatter.src)` branch of `fs.ts`, after computing `path`
and before the `existsSync(path)` check, add:
```ts
const ancestorPaths = new Set((importChain ?? []).map(s => s.filepath))
if (path === slide.filepath || ancestorPaths.has(path)) {
  md.errors ??= []
  md.errors.push({
    row: slide.start,
    message: `Circular import detected for "${slide.frontmatter.src}" (${path})`,
  })
  return
}
```
This stops before re-entering an ancestor file, records a diagnostic, and lets
loading continue for the rest of the deck.

### Step 2: Add fixtures that form a cycle

Create `test/fixtures/markdown/circular/a.md`:
```markdown
# A

---
src: ./b.md
---
```
Create `test/fixtures/markdown/circular/b.md`:
```markdown
---
src: ./a.md
---
```

### Step 3: Add a dedicated test

In `test/parser.test.ts`, add an `it` (outside the fixture loop):
```ts
it('detects circular src imports without overflowing', async () => {
  const root = resolve(__dirname, 'fixtures/markdown/circular')
  const data = await load({ userRoot: root, roots: [root] }, resolve(root, 'a.md'))
  // Must return (not hang / overflow) and record a circular-import diagnostic
  const errors = Object.values(data.markdownFiles).flatMap(md => md.errors ?? [])
  expect(errors.some(e => /circular/i.test(e.message))).toBe(true)
})
```
Match the file's existing import of `load`/`resolve` (already imported at the top
of `test/parser.test.ts`).

**Verify**: `pnpm build && pnpm test -- parser` → the new test passes and the
suite does not hang (it completes in seconds, not via a stack-overflow crash).

## Test plan

- New test: `test/parser.test.ts` › "detects circular src imports…" — asserts
  `load` returns and records a `circular`-matching error. This is the regression
  guard for the stack overflow.
- Model: the existing dedicated `it('parse', …)` tests in the same file.
- Also confirm the pre-existing fixture snapshots are unchanged (no snapshot
  churn): `pnpm test -- parser` reports 0 obsolete/updated snapshots.

## Done criteria

- [ ] `loadSlide` records an error and returns instead of recursing when `path` is an ancestor or self
- [ ] New fixtures exist under `test/fixtures/markdown/circular/`
- [ ] New test passes and the suite completes without a stack-overflow
- [ ] Existing parser snapshots are unchanged
- [ ] `pnpm build && pnpm typecheck` exit 0
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `SourceSlideInfo` has no `filepath`/`start` field at these call sites (the
  excerpts would then be stale — re-verify against the live types).
- A legitimate non-circular fixture starts reporting a false "circular" error
  (indicates the ancestor check is too broad — importing the same file twice in
  *sibling* slides must remain allowed).

## Maintenance notes

- The guard keys on ancestor filepaths, so importing one file from two sibling
  slides (not a cycle) still works.
- If range-scoped partial imports of the same file become a supported cycle-free
  pattern, revisit whether the key should include the range.
- Reviewer: confirm the diagnostic surfaces to the user (errors are rendered in
  the dev overlay / logged).
