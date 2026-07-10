# Plan 006: Replace the `edit` shortcut's shell-string `exec` with argv-based `execFile`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If
> anything in "STOP conditions" occurs, stop and report. When done, update the
> status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- packages/slidev/node/cli.ts`
> If `cli.ts` changed since this plan was written, compare the "Current state"
> excerpt against the live code; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security / bug
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

The interactive `e` (edit) shortcut builds a shell command by string
interpolation of the deck path: `exec(\`code "${entry}"\`)`. A deck path
containing a double-quote or shell metacharacters is parsed by the shell —
classic command-injection shape. It's largely self-inflicted (the operator
supplies `entry`), but it's the last shell-string spawn in the CLI and is direct
**drift** from the recent hardening that removed an unsafe `exec()` from
`resolver.ts` (commit "fix: remove unsafe exec() in resolver.ts") in favor of
argv-array spawns. Switching to `execFile` passes the path as a single argv
element, so no shell ever parses it.

## Current state

- `packages/slidev/node/cli.ts:4` imports:
  ```ts
  import { exec } from 'node:child_process'
  ```
- The edit shortcut (`packages/slidev/node/cli.ts:248-254`):
  ```ts
  {
    name: 'e',
    fullname: 'edit',
    action() {
      exec(`code "${entry}"`)
    },
  },
  ```
  `entry` is the resolved deck path (a `string`), captured in the enclosing
  serve handler closure.
- `exec` is used **only** at line 252 (verified: `grep -n "exec(" packages/slidev/node/cli.ts`
  returns only this call; `execFile`/`spawn` are not yet imported).

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install | `pnpm install` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `packages/slidev/node/cli.ts`

**Out of scope**:
- Any other spawn/exec in the codebase (there are none left in `cli.ts`).
- Changing which editor is launched, or adding editor configurability beyond the
  minimal `EDITOR` fallback in Step 2 (keep the change tight).

## Git workflow

- Branch: `fix/edit-shortcut-execfile`.
- Conventional commit: `fix(cli): avoid shell interpolation in edit shortcut`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Switch the import from `exec` to `execFile`

Change `packages/slidev/node/cli.ts:4`:
```ts
import { execFile } from 'node:child_process'
```

### Step 2: Pass the path as an argv element

Replace the action body at `cli.ts:252`:
```ts
action() {
  const editor = process.env.EDITOR || 'code'
  execFile(editor, [entry])
},
```
`process` is Node's global; if the file does not already import it, add
`import process from 'node:process'` at the top (check existing imports first —
`cli.ts` may already import `process`). Do not introduce a shell.

**Verify**: `grep -n "exec(" packages/slidev/node/cli.ts` returns **no** matches;
`grep -n "execFile(editor" packages/slidev/node/cli.ts` returns one match.

### Step 3: Build, typecheck, lint

**Verify**: `pnpm build && pnpm typecheck && pnpm lint` all exit 0.

## Test plan

- This is an interactive TTY shortcut with no existing unit coverage and a hard
  external dependency (`code`), so no automated test is added — matching the
  repo's current approach for the shortcut table. Manual check (optional, if a
  local dev deck exists): press `e` in `pnpm demo:dev` and confirm the editor
  opens. The load-bearing guarantee (no shell parsing) is structural: `execFile`
  with an argv array cannot interpret metacharacters.

## Done criteria

- [ ] `cli.ts` imports `execFile` (not `exec`)
- [ ] The edit action calls `execFile(editor, [entry])` with no shell string
- [ ] `grep -n "exec(" packages/slidev/node/cli.ts` returns no matches
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint` all exit 0
- [ ] Only `cli.ts` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `cli.ts` already uses `execFile`/`spawn` for this shortcut (someone fixed it) —
  mark the finding resolved in `plans/README.md` and stop.
- The edit action needs to launch editors that genuinely require shell parsing
  (e.g. a user-configured command with args) — that's a larger design change;
  report rather than reintroducing a shell.

## Maintenance notes

- If editor configurability is added later, resolve it to a command + argv array,
  never a single shell string.
- Reviewer: confirm no other `exec`/`execSync` shell-string spawn was introduced.
