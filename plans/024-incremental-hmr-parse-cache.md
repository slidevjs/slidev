# Plan 024: Incremental parse cache for HMR (stop re-parsing the whole deck per edit)

> **Executor instructions**: This is a **performance** change with real
> correctness risk (cache invalidation). Measure first, change second, and keep
> a fast escape hatch. Run the full suite after each step. Honor STOP conditions.
> When done, update the status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/parser/src/fs.ts packages/parser/src/core.ts packages/slidev/node/vite/loaders.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: MED
- **Depends on**: none (coordinate with 012, which awaits a per-HMR utils refresh)
- **Category**: perf
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

On every hot update, the loader reloads the entire deck: `parser.load` builds a
**fresh** `markdownFiles` map, re-reads and re-`parse`s every `src:`-imported file
from disk (even unchanged ones), and re-runs feature detection over the whole
concatenated deck. So a one-character edit costs O(total deck bytes + number of
imported files) each debounced save — growing with deck size and import count.
An incremental cache (re-parse only changed files; re-detect features per file)
makes edit cost scale with the edit, not the deck.

## Current state

`packages/parser/src/fs.ts:40-159` (`load`):
```ts
const markdownFiles: Record<string, SlidevMarkdown> = {}   // fresh each call
// loadMarkdown re-reads + parses any file not already in THIS call's map:
async function loadMarkdown(path, ...) {
  let md = markdownFiles[path]
  if (!md) { const raw = await loadSource(path); md = await parse(raw, path, extensions); markdownFiles[path] = md; ... }
  // ...
}
// ...
return {
  slides,
  entry,
  headmatter,
  features: detectFeatures(slides.map(s => s.source.raw).join('')),  // whole-deck scan every call
  markdownFiles,
  watchFiles,
}
```
Driver: `packages/slidev/node/vite/loaders.ts:153-155` calls
`serverOptions.loadData({ [ctx.file]: await ctx.read() })` on any watched change;
`cli.ts:158-160` forwards to `parser.load`. `detectFeatures` and
`scanMonacoReferencedMods` (`core.ts`) run over the joined deck.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test -- parser` | all pass (incl. new cache tests) |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/parser/src/fs.ts` (per-file parse cache keyed by content)
- `packages/parser/src/core.ts` (per-file feature detection, if features are merged)
- `packages/slidev/node/vite/loaders.ts` (only if the driver must pass/keep a cache)
- Tests in `test/parser.test.ts` / colocated parser tests

**Out of scope**:
- Changing the parsed output shape or the public `load` return type.
- Preparser-extension semantics (must remain correct across the cache).

## Git workflow

- Branch: `perf/incremental-parse-cache`.
- Conventional commit(s): `perf(parser): cache per-file parse across reloads`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Measure the baseline (STOP-gated by data)

Before changing anything, quantify the cost so the win is real: add a temporary
timing log (or a Vitest benchmark) around `load` for a large synthetic deck
(e.g. 200 slides, several `src:` imports) and record parse time per reload.
**If the measured cost is negligible, STOP** and report — this plan may not be
worth doing for typical decks.

### Step 2: Add a content-keyed per-file parse cache

Introduce a cache (a `Map<filepath, { hash: string; md: SlidevMarkdown }>`) that
survives across `load` calls (owned by the caller and passed in, or a module-level
cache in `fs.ts` with an explicit invalidation API). In `loadMarkdown`, compute a
cheap hash of the file source; reuse the cached `SlidevMarkdown` when the hash
matches, otherwise re-parse and update the cache. Ensure preparser `extensions`
identity is part of the key (a different extension set must invalidate).

### Step 3: Make feature detection incremental

Instead of `detectFeatures(join(all raw))` every call, detect features per file
(cache per file) and merge. Preserve the exact resulting `features` object shape
and values (it feeds `data.features`, which HMR compares with `fast-deep-equal`).

### Step 4: Verify correctness across edits

Confirm that editing one file invalidates exactly that file (and dependents via
`src:`), that adding/removing a slide still updates counts, and that
preparser-extension changes bust the cache.

**Verify**: `pnpm build && pnpm test -- parser` → all existing parser snapshots
**unchanged** (the cache must be transparent), plus new cache tests pass.

## Test plan

- New tests: (a) two `load`s of the same unchanged content reuse the cached parse
  (assert via a spy/counter that `parse` runs once); (b) changing a file's content
  re-parses only that file; (c) features/`markdownFiles` output is identical to
  the non-cached path for the existing fixtures (snapshot parity).
- The existing `test/parser.test.ts` fixture snapshots are the transparency
  guarantee — they must not change.

## Done criteria

- [ ] Unchanged files are not re-parsed across reloads (proven by a test/counter)
- [ ] Feature detection no longer scans the whole deck when only one file changed
- [ ] All existing parser snapshots are unchanged (cache is transparent)
- [ ] Preparser-extension changes correctly invalidate the cache
- [ ] `pnpm build && pnpm typecheck && pnpm test -- parser` pass
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Step 1 shows the current cost is negligible for realistic decks (don't add cache
  complexity for no measurable gain).
- Any existing parser snapshot changes (indicates the cache is not transparent —
  a correctness regression).
- Cache invalidation interacts with preparser extensions or `src:` graphs in a way
  you can't make provably correct — report rather than shipping a subtly-stale cache.

## Maintenance notes

- A stale parse cache is a nasty class of bug; keep the invalidation key simple
  and total (content hash + extensions identity + import graph).
- Coordinates with plan 012: if the per-HMR `utils` refresh is awaited, this cache
  reduces the cost that made that refresh expensive.
- Reviewer: focus on invalidation correctness, not just the speedup.
