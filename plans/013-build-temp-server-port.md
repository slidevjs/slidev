# Plan 013: Use a free port and guaranteed cleanup for build's temporary servers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/commands/build.ts`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S-M
- **Risk**: MED
- **Depends on**: none (pairs well after 007)
- **Category**: bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`slidev build` spins up two temporary static servers (og-image generation and
`--download` PDF) on a **hardcoded** port `12445`, with **no `'error'` handler**
and `server.close()` only on the success path. If `12445` is busy (e.g. a
concurrent `slidev export`, which itself uses `getPort(12445)`), the unhandled
`'error'` event crashes the build; and if `exportSlides` throws, the `connect`
server leaks. The rest of the CLI already picks a free port via `getPort`.

## Current state

`packages/slidev/node/commands/build.ts` — two near-identical blocks:

og-image (`:76-121`):
```ts
const port = 12445
const app = connect()
const server = http.createServer(app)
app.use(config.base, sirv(outDir, { etag: true, single: true, dev: true }))
server.listen(port)

const { exportSlides } = await import('./export')
const tempDir = resolve(outDir, 'temp')
await fs.mkdir(tempDir, { recursive: true })
await exportSlides({ port, /* ... */ })
// ... copy png ...
await fs.rm(tempDir, { recursive: true, force: true })
server.close()
```

`--download` (`:137-156`):
```ts
const port = 12445
const app = connect()
const server = http.createServer(app)
app.use(config.base, sirv(outDir, { etag: true, single: true, dev: true }))
server.listen(port)
const filename = options.data.config.exportFilename || 'slidev-exported'
await exportSlides({ port, base: config.base, ...getExportOptions(args, options, join(outDir, `${filename}.pdf`)) })
server.close()
```

The free-port helper is already imported and used elsewhere:
`packages/slidev/node/cli.ts:13` → `import { getPort } from 'get-port-please'`;
`cli.ts:479` / `:553` → `const candidatePort = await getPort(12445)`.
`get-port-please` is a prod dependency (`pnpm-workspace.yaml`).

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/commands/build.ts`

**Out of scope**:
- `commands/export.ts` browser teardown (plan 007).
- The `exportFilename` traversal concern (plan 016) — do not add path
  confinement here; just don't regress it.
- Behavior of the generated output (og image, download PDF) — keep identical.

## Git workflow

- Branch: `fix/build-temp-server-port`.
- Conventional commit: `fix(build): use free port and always close temp servers`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Import `getPort`

Add to `build.ts` imports:
```ts
import { getPort } from 'get-port-please'
```

### Step 2: og-image block — free port + try/finally

Replace `const port = 12445` (og-image, `:76`) with `const port = await getPort(12445)`,
and wrap the export + copy + temp-dir cleanup so the server is always closed:
```ts
const port = await getPort(12445)
const app = connect()
const server = http.createServer(app)
app.use(config.base, sirv(outDir, { etag: true, single: true, dev: true }))
server.listen(port)
try {
  const { exportSlides } = await import('./export')
  const tempDir = resolve(outDir, 'temp')
  await fs.mkdir(tempDir, { recursive: true })
  await exportSlides({ port, /* ...unchanged... */ })
  const tempFiles = await fs.readdir(tempDir)
  const pngFile = tempFiles.find(file => file.endsWith('.png'))
  if (pngFile) {
    const generatedPath = resolve(tempDir, pngFile)
    await fs.copyFile(generatedPath, projectOgImagePath)
    await fs.copyFile(generatedPath, outputOgImagePath)
  }
  await fs.rm(tempDir, { recursive: true, force: true })
}
finally {
  server.close()
}
```
Keep the `exportSlides({ ... })` argument object exactly as it is today.

### Step 3: `--download` block — free port + try/finally

Replace `const port = 12445` (`:137`) with `const port = await getPort(12445)`
and wrap the `exportSlides(...)` call in `try { ... } finally { server.close() }`.

**Verify**: `grep -n "12445" packages/slidev/node/commands/build.ts` shows both
occurrences now inside `getPort(12445)`; `grep -n "server.close()" build.ts`
shows both inside `finally` blocks.

### Step 4: Build / typecheck / lint

**Verify**: `pnpm build && pnpm typecheck && pnpm lint` exit 0.

## Test plan

- `build` needs Playwright + a full Vite build, so no unit test is added
  (consistent with `build.ts` having none). Verification is structural
  (free-port + finally-close, Step 3 grep) plus build/typecheck. If a local
  environment with `playwright-chromium` exists, optionally run
  `pnpm demo:build` (or `slidev build` on the demo with `download: true`) and
  confirm the PDF is produced and no port error occurs when run twice
  concurrently.

## Done criteria

- [ ] Both temp servers bind to `await getPort(12445)`, not a hardcoded literal
- [ ] Both `server.close()` calls are in `finally` blocks
- [ ] Output artifacts (og image, download PDF) are produced exactly as before
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint` exit 0
- [ ] Only `build.ts` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `getPort`'s chosen port is not actually threaded into `exportSlides` (the
  `port` variable must be the one passed) — verify both call sites pass the new
  `port`.
- The og-image/download output changes shape or location after the refactor.

## Maintenance notes

- If both blocks are later unified into a helper (`serveOutDir(outDir, base)`),
  keep the free-port + finally-close semantics.
- Reviewer: confirm no `'error'`-less `server.listen` remains and that
  concurrent builds/exports no longer collide on `12445`.
