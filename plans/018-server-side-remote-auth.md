# Plan 018: Enforce the `--remote` secret on the server, not just the client router

> **Executor instructions**: This is a larger security *design + implementation*
> plan touching the dev-server trust boundary. Read it fully first. Follow the
> steps, run every verification, and honor the STOP conditions — several ask you
> to pause and confirm the approach before writing broad changes. When done,
> update the status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/client/setup/routes.ts packages/slidev/node/vite/loaders.ts packages/slidev/node/vite/monacoWrite.ts packages/slidev/node/vite/serverRef.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P3 (high value, larger lift — schedule deliberately)
- **Effort**: M-L
- **Risk**: MED
- **Depends on**: none; **subsumes** the network-exposure parts of 015/017
  (still land 015's path validation as defense-in-depth)
- **Category**: security
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

The `--remote <password>` feature's only access gate is a **client-side** Vue
Router `beforeEnter` guard. The dev server's privileged surface has no
server-side check:

- `GET /__slidev/slides/<n>.json` returns full slide content **and rendered
  speaker notes**.
- `POST /__slidev/slides/<n>.json` mutates slide content/frontmatter/notes and
  **persists `slides.md` to disk** (`parser.save`).
- ws handlers write files (Monaco) and persist drawings/snapshots.

So anyone who can reach the server — the LAN when `--remote` binds `0.0.0.0`, the
internet when `--tunnel` is added, or a malicious page via CSRF in default
localhost mode — can read private notes and overwrite the presenter's deck,
bypassing the password prompt entirely (it only hides SPA routes). This plan adds
a real server-side authorization boundary.

## Current state

- Client-only guard — `packages/client/setup/routes.ts:8-20`:
  ```ts
  function passwordGuard(to: RouteLocationNormalized) {
    if (!configs.remote || configs.remote === to.query.password) return true
    if (configs.remote && to.query.password === undefined) {
      const password = prompt('Enter password')
      if (configs.remote === password) return true
    }
    // redirect away
  }
  ```
  Applied only as `beforeEnter` on presenter/notes/print/export routes.
- Unauthenticated privileged HTTP middleware — `packages/slidev/node/vite/loaders.ts:79-141`
  (GET returns `withRenderedNote(data.slides[idx])`; POST mutates + `parser.save`).
- Unauthenticated ws sinks — `vite/monacoWrite.ts:23-32`, `vite/serverRef.ts:28-36`.
- The shared secret is `configs.remote` (the `--remote` password), already
  surfaced to the client via the `#slidev/configs` virtual module.

## Design decisions to confirm BEFORE broad implementation

Use the `question` flow or report back to the operator on these (each has a
recommended default). **Do not** write the full change until these are settled:

1. **Scope of enforcement** — recommended: require auth on all **mutating**
   endpoints (POST slides, monaco-write, drawings/snapshot persist) and on
   **notes** content always; gate read of slide JSON only when `remote` is set.
2. **Credential mechanism** — recommended: a per-session token minted by the
   server on startup (not the raw password), delivered to the trusted client via
   the `#slidev/configs` virtual module, sent on each privileged request
   (`Authorization: Bearer` / a header for HTTP, a field in ws messages). The
   `--remote` password remains the human gate to *obtain* a session.
3. **Default-localhost behavior** — recommended: keep mutation enabled locally
   but require the token (defeats CSRF); do not silently disable the editor.
4. **Backward compatibility** — recommended: when neither `remote` nor editor
   features are enabled, behavior is unchanged for read paths.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Test | `pnpm test` | pass (add auth-helper tests) |

## Scope

**In scope** (after design confirmation):
- `packages/slidev/node/vite/loaders.ts` — auth check in the `/__slidev/*` middleware
- `packages/slidev/node/vite/monacoWrite.ts`, `vite/serverRef.ts` — auth on privileged ws messages
- Token minting/plumbing: a new small module (e.g. `node/auth.ts`) + the config
  virtual module (`node/virtual/configs.ts`) to expose the token to the client
- `packages/client/**` editor/presenter/remote code that calls these endpoints,
  to send the token
- A unit test for the token verify helper

**Out of scope**:
- Redesigning the presenter/remote UX beyond passing a token.
- TLS/transport security (that's the tunnel/user's responsibility).
- The path-traversal validations (plan 015) — land those independently.

## Git workflow

- Branch: `feat/server-side-remote-auth`.
- Conventional commit(s): `feat(security): authorize privileged dev-server endpoints`.
- Do NOT push/PR unless instructed. This is a security-sensitive change — expect
  review.

## Steps

### Step 1: Confirm the design (STOP-gated)

Resolve the four decisions above with the operator. Record the chosen answers at
the top of the branch's first commit message or in a short note. **STOP** and ask
if any answer is unclear — do not improvise a security protocol.

### Step 2: Mint and expose a session token

Add `node/auth.ts` that, when `remote`/editor is enabled, generates a random
token at server start (`crypto.randomUUID()` or `crypto.randomBytes`). Expose it
to the trusted client through the config virtual module so the app can attach it;
never log the token value.

### Step 3: Enforce on the HTTP middleware

In `loaders.ts`, before serving/ mutating in the `/__slidev/*` handler, verify
the token per the confirmed scope (Step 1 decision 1). Return `401` when missing/
wrong. Keep the bounds check from plan 011 if present.

### Step 4: Enforce on the ws sinks

Require the token field in `slidev:monaco-write` and in the server-ref persistence
path; reject otherwise. Combine with plan 017's origin check if that landed.

### Step 5: Update the client callers

Make the editor save, presenter sync, and remote-control code send the token with
each privileged call. Verify HMR and normal navigation are unaffected.

### Step 6: Unit-test the verifier

Test the pure token-compare helper (constant-time compare if feasible) for
match/mismatch/missing.

**Verify**: `pnpm build && pnpm typecheck && pnpm lint && pnpm test` all pass;
manual check with `pnpm demo:dev` that editing/notes still work in-app and that a
request without the token to `POST /__slidev/slides/1.json` is rejected (`401`).

## Test plan

- Unit-test the token verifier (deterministic).
- Manual/integration: in-app editor save works; an unauthenticated
  `POST /__slidev/slides/<n>.json` and an unauthenticated `monaco-write` are
  rejected. If plan 022 introduces a server test harness, add these as automated
  cases.

## Done criteria

- [ ] Design decisions (Step 1) are recorded
- [ ] Privileged HTTP endpoints reject unauthenticated requests (per chosen scope)
- [ ] Privileged ws handlers reject unauthenticated messages
- [ ] The trusted client attaches the token; in-app editor/notes/presenter still work
- [ ] Token value is never logged or written to disk in plaintext logs
- [ ] Token verifier is unit-tested
- [ ] `pnpm build && pnpm typecheck && pnpm lint && pnpm test` pass
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- Any Step 1 decision is unresolved.
- Enforcing auth breaks HMR, cross-device remote control, or the browser
  exporter in a way that can't be fixed by passing the token.
- The change starts sprawling beyond the in-scope files (e.g. requiring a new
  transport) — re-scope with the operator.

## Maintenance notes

- Treat the client `passwordGuard` as cosmetic UX after this lands; the server is
  the real boundary.
- Keep plan 015 (path validation) and 017 (origin) as defense-in-depth even with
  auth in place.
- Reviewer: scrutinize the token lifecycle (generation, exposure only to the
  trusted client, comparison), and confirm no privileged endpoint is left ungated.
