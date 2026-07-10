# Plan 017: Validate WebSocket Origin before running privileged ws handlers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`. Security-hardening change: code + tests only.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/vite/monacoWrite.ts packages/slidev/node/vite/serverRef.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (complements 015; subsumed by 018 if that lands first)
- **Category**: security
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

The privileged ws handlers (Monaco write-back; drawings/snapshot persistence via
server-ref) run on Vite's shared HMR WebSocket. WebSocket handshakes are **not**
subject to the same-origin policy, so any web page the presenter visits while a
Slidev dev server is running can open a socket to `ws://localhost:<port>` and
drive these handlers — a drive-by, even in default localhost mode with no
`--remote`. Checking the connection's `Origin`/host against the known dev-server
origins before acting on privileged messages closes the cross-origin path.

## Current state

- `packages/slidev/node/vite/monacoWrite.ts:13-35`:
  ```ts
  configureServer(server) {
    server.ws.on('connection', (socket) => {
      socket.on('message', async (data) => {
        // parse JSON; if event === 'slidev:monaco-write' → fs.writeFile(...)
      })
    })
  }
  ```
  No inspection of the connection's origin/host.
- `packages/slidev/node/vite/serverRef.ts:28-36`: `onChanged` persists `drawings`
  and `snapshots` from synced state, driven by the same ws, also without origin
  checks.
- `server.ws.on('connection', (socket, request) => …)` provides the upgrade
  `request` (an `http.IncomingMessage`) as the second argument; its
  `request.headers.origin` / `request.headers.host` are what to validate. **Confirm
  this signature against the installed Vite version before relying on it** (see
  STOP conditions).

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Test | `pnpm test -- origin` (new helper test) | pass |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/vite/monacoWrite.ts` (origin gate on the privileged handler)
- `packages/slidev/node/vite/serverRef.ts` (origin gate on privileged persistence),
  if reachable via the same connection hook
- A shared `isAllowedWsOrigin` helper + its unit test (likely in `node/utils.ts`)

**Out of scope**:
- Full request authentication / tokens (plan 018).
- The path-traversal validation in the same sinks (plan 015) — independent.
- HMR / non-privileged ws messages (must keep working across devices).

## Git workflow

- Branch: `fix/ws-origin-validation`.
- Conventional commit: `fix(security): validate ws origin for privileged handlers`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Add an origin allow-list helper

Add a pure helper that decides whether an origin/host is allowed. The allow-set
is: the dev server's own origins (localhost + the LAN host when `--remote` binds
`0.0.0.0`) plus any explicitly configured remote hosts. Keep it conservative and
testable:
```ts
export function isAllowedWsOrigin(
  origin: string | undefined,
  allowedHosts: string[],   // e.g. ['localhost', '127.0.0.1', '[::1]', <configured host>]
): boolean {
  if (!origin) return false            // no Origin header → treat as untrusted for privileged ops
  try {
    const { hostname } = new URL(origin)
    return allowedHosts.includes(hostname)
  }
  catch {
    return false
  }
}
```

### Step 2: Gate the Monaco write handler

In `monacoWrite.ts`, capture the upgrade request and check origin before
performing the write:
```ts
server.ws.on('connection', (socket, request) => {
  socket.on('message', async (data) => {
    // ... parse json ...
    if (json.type === 'custom' && json.event === 'slidev:monaco-write') {
      if (!isAllowedWsOrigin(request.headers.origin, buildAllowedHosts(server, options))) {
        console.error('[slidev] Rejected monaco-write from disallowed origin')
        return
      }
      // ... existing whitelist + path checks + write ...
    }
  })
})
```
`buildAllowedHosts` derives the list from the resolved server config
(`server.config.server.host`, the resolved port/host, and any Slidev `remote`
host). Keep non-privileged messages unaffected.

### Step 3: Gate server-ref persistence if applicable

If `serverRef.ts`'s `onChanged` can be triggered cross-origin through the same
socket, apply the same origin gate (or route persistence through a checked
channel). If server-ref does not expose the origin at `onChanged`, document that
limitation and rely on plan 018 for that sink.

**Verify**: reading the handlers, a privileged action only runs when the
connection origin is in the allow-list.

### Step 4: Unit test the helper

`packages/slidev/node/vite/origin.test.ts` (or near `utils.ts`):
```ts
import { describe, expect, it } from 'vitest'
import { isAllowedWsOrigin } from '../utils'

describe('isAllowedWsOrigin', () => {
  const hosts = ['localhost', '127.0.0.1']
  it('allows localhost', () => expect(isAllowedWsOrigin('http://localhost:3030', hosts)).toBe(true))
  it('rejects foreign origin', () => expect(isAllowedWsOrigin('https://evil.example', hosts)).toBe(false))
  it('rejects missing origin', () => expect(isAllowedWsOrigin(undefined, hosts)).toBe(false))
})
```

**Verify**: `pnpm build && pnpm test -- origin` passes.

## Test plan

- Unit-test `isAllowedWsOrigin` (deterministic).
- The live ws wiring is verified by code review + typecheck (no ws integration
  harness exists). If plan 018 later adds a test server, extend it with a
  foreign-origin rejection case.
- Manual sanity (optional): with `pnpm demo:dev`, confirm the Monaco live-coding
  save and drawings still work from the app's own origin.

## Done criteria

- [ ] Privileged ws handlers reject connections whose `Origin` is not in the allow-list
- [ ] Non-privileged HMR messages are unaffected (dev server + cross-device remote still work)
- [ ] `isAllowedWsOrigin` is unit-tested
- [ ] `pnpm build && pnpm typecheck` exit 0
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not guess the API) if:

- The installed Vite version's `server.ws.on('connection', …)` does not surface
  the upgrade `request`/origin — then origin validation must move to the ws
  `upgrade`/`verifyClient` layer, which is a different integration point; report
  the Vite version and the available hook.
- A conservative allow-list would break legitimate cross-device remote control
  (`--remote`) — the configured remote host must be included; if it can't be
  derived, coordinate with plan 018 (token-based auth) instead.

## Maintenance notes

- Origin checks are a same-site defense; they do not replace authentication for
  networked (`--remote`/`--tunnel`) use — that's plan 018.
- Reviewer: confirm the allow-list includes every origin the app legitimately
  serves itself from, and nothing else.
