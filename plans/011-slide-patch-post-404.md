# Plan 011: Return 404 on out-of-range slide-patch requests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/vite/loaders.ts`
> On a mismatch with the excerpt below, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

The dev-server middleware for `/__slidev/slides/<n>.json` computes
`idx = Number.parseInt(no) - 1` and, on `POST`, immediately dereferences
`data.slides[idx].source.content`. If `n` is past the deck length (a stale
editor after a slide was deleted, or a bad request), `slide` is `undefined` and
the handler throws inside the async middleware → hung request + unhandled
rejection. The `GET` branch tolerates a missing slide; `POST` should too.

## Current state

`packages/slidev/node/vite/loaders.ts:79-138` (inside `configureServer`):
```ts
server.middlewares.use(async (req, res, next) => {
  const match = req.url?.match(regexSlideReqPath)
  if (!match) return next()
  const [, no] = match
  const idx = Number.parseInt(no) - 1
  if (req.method === 'GET') {
    res.write(JSON.stringify(withRenderedNote(data.slides[idx])))
    return res.end()
  }
  else if (req.method === 'POST') {
    const body: SlidePatch = await getBodyJson(req)
    const slide = data.slides[idx]          // ← may be undefined
    if (body.content && body.content !== slide.source.content)  // ← throws here
      hmrSlidesIndexes.add(idx)
    // ... more slide.* mutations, then parser.save(...)
  }
  next()
})
```
`withRenderedNote` (`loaders.ts:426-432`) already handles `undefined` via
optional chaining, so `GET` degrades gracefully; only `POST` is unguarded.

This middleware has no colocated test (the loader is untested today).

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/vite/loaders.ts` (add a bounds check in the middleware)

**Out of scope**:
- The unauthenticated-endpoint concern (plans 015/018).
- The HMR/no-op-utils issues (plan 012).
- Any change to `getBodyJson` or `parser.save`.

## Git workflow

- Branch: `fix/slide-patch-bounds`.
- Conventional commit: `fix(server): 404 on out-of-range slide patch`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Guard both branches on a missing slide

Right after `const idx = Number.parseInt(no) - 1`, add a bounds check that
serves a 404 for an out-of-range (or NaN) index, before either branch runs:
```ts
const idx = Number.parseInt(no) - 1
const targetSlide = data.slides[idx]
if (!targetSlide) {
  res.statusCode = 404
  return res.end()
}
```
Then use `targetSlide` (or keep the existing `data.slides[idx]` reads, now known
to be defined) in both the `GET` and `POST` branches. Ensure the `POST` branch's
`const slide = data.slides[idx]` still resolves to the same object.

**Verify**: reading the handler, no code path dereferences `data.slides[idx]`
without the preceding `if (!targetSlide) return 404`.

### Step 2: Build / typecheck / lint

**Verify**: `pnpm build && pnpm typecheck && pnpm lint` exit 0.

## Test plan

- The loader middleware has no unit harness today, so no automated test is added
  in this plan (adding one is plan 022's scope). The fix is a defensive
  bounds-check verified by code review + typecheck. Optional manual check with a
  running `pnpm demo:dev`: `curl -X POST localhost:<port>/__slidev/slides/9999.json`
  returns `404` instead of hanging.

## Done criteria

- [ ] An out-of-range/NaN slide index returns HTTP 404 for both GET and POST
- [ ] No dereference of `data.slides[idx]` occurs before the bounds check
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint` exit 0
- [ ] Only `loaders.ts` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `regexSlideReqPath` allows non-numeric `no` in a way that makes `Number.parseInt`
  produce a surprising index (re-check `vite/common.ts`); adjust the guard to
  reject NaN explicitly (`Number.isNaN(idx)`).

## Maintenance notes

- When plan 022 adds loader tests, add a case for the out-of-range POST → 404.
- Reviewer: confirm the 404 doesn't break the editor's normal save flow (valid
  indices are unaffected).
