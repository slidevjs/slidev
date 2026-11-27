# Plan 005: Add a contributor `AGENTS.md`

> **Executor instructions**: Follow this plan step by step. If anything in
> "STOP conditions" occurs, stop and report. When done, update the status row
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- AGENTS.md CONTRIBUTING.md package.json scripts/publish.mjs`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (references 003's `verify` script if it exists)
- **Category**: dx / docs
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

This repo *ships* agent tooling to its users (`.claude-plugin/`, `skills/slidev/`)
but has **no** `AGENTS.md`/`CLAUDE.md` for agents or newcomers working *in* the
repo. Several conventions are non-obvious and easy to get wrong: tests need a
prior build, dependencies are pinned through pnpm **catalogs** (not raw versions),
and `skills/` is **generated** (must not be hand-edited) and is copied into the
published package. A short `AGENTS.md` captures the executable ground rules.

## Current state

- No `AGENTS.md` or `CLAUDE.md` exists anywhere (glob returns none).
- Monorepo layout (from `CONTRIBUTING.md:76-84`):
  ```
  packages/slidev/   - Node.js side (CLI, Vite plugins)
  packages/client/   - frontend Vue app (shipped as source)
  packages/parser/   - Slidev extended-Markdown parser
  packages/create-app/, create-theme/ - scaffolding
  packages/vscode/   - VSCode extension
  packages/types/    - shared types
  ```
- Scripts (`package.json:9-28`): `build`, `dev`, `lint`, `typecheck`, `test`,
  `docs`. Tests require a prior build.
- Dependency management: pnpm catalogs in `pnpm-workspace.yaml` (`catalog:prod`,
  `catalog:dev`, `catalog:frontend`, etc.) — deps reference catalog keys, not
  literal versions.
- `skills/` is generated: `skills/GENERATION.md` documents the process, and
  `scripts/publish.mjs:4` copies `skills` into `packages/slidev/skills` at publish
  time (so it ships in `@slidev/cli`). It must be regenerated from `docs/`, not
  edited by hand.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Lint (markdown is ignored, but run anyway) | `pnpm lint` | exit 0 |

(No build/test required — this plan adds one Markdown file.)

## Scope

**In scope**:
- `AGENTS.md` (create, repo root)

**Out of scope**:
- `CONTRIBUTING.md` (leave as the human-facing doc; `AGENTS.md` complements it).
- Any config that would make tools *load* AGENTS.md differently.
- Generating/editing `skills/` content.

## Git workflow

- Branch: `docs/agents-md`.
- Conventional commit: `docs: add AGENTS.md for contributors`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Write `AGENTS.md`

Create `AGENTS.md` at the repo root with these sections (keep it under ~60 lines,
factual, matching the current state above):

- **Project map** — the package table from Current state, one line each.
- **Build & verify** — `pnpm install`, then `pnpm build` **before** `pnpm test`
  (tests resolve workspace packages to `dist/`). If plan 003 landed, point at
  `pnpm verify`. List `pnpm typecheck` (`vue-tsc --noEmit`) and `pnpm lint`
  (`eslint . --cache`).
- **Dependencies** — versions are managed via pnpm **catalogs** in
  `pnpm-workspace.yaml`; reference a catalog key (`catalog:prod`, etc.), don't
  hardcode versions; `taze` manages bumps.
- **Generated content — do not hand-edit** — `skills/slidev/**` is generated
  from `docs/` (see `skills/GENERATION.md`) and copied into the published
  package by `scripts/publish.mjs`; regenerate via the documented process.
  Also note `docs/components.d.ts` and other generated artifacts if present.
- **Conventions** — Conventional Commits for messages and PR titles; code style
  is enforced by ESLint via a pre-commit hook (`simple-git-hooks` +
  `lint-staged`), so no manual formatting needed.
- **Releases** — never release autonomously; version bumps/tags are
  human-approved (`pnpm release` is maintainer-run).

**Verify**: `test -f AGENTS.md && wc -l AGENTS.md` prints a line count > 0.

## Test plan

- No tests. This is documentation. Verify it is internally consistent with
  `package.json` scripts and `CONTRIBUTING.md` by re-reading both.

## Done criteria

- [ ] `AGENTS.md` exists at repo root and covers: project map, build/verify (build-before-test), catalogs, generated `skills/`, conventions, releases
- [ ] Every command it names matches a real script in `package.json`
- [ ] `pnpm lint` exits 0
- [ ] Only `AGENTS.md` added (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `package.json` scripts differ from the excerpts (document what actually exists,
  and report the drift).

## Maintenance notes

- Keep the command list in sync with `package.json` scripts.
- If a `CLAUDE.md`/tool-specific file is also wanted, symlink or re-export from
  `AGENTS.md` rather than duplicating.
