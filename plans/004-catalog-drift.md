# Plan 004: Fix catalog drift — runtime deps must not reference `catalog:dev`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If
> anything in "STOP conditions" occurs, stop and report. When done, update the
> status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c63cb120..HEAD -- pnpm-workspace.yaml packages/slidev/package.json`
> On a mismatch with the excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: migration (dependency hygiene)
- **Planned at**: commit `c63cb120`, 2026-07-10

## Why this matters

`@slidev/slidev` declares two **runtime** dependencies whose versions are pinned
from the **`dev`** pnpm catalog. They resolve fine today, but the mismatch
misleads dependency audits and `taze`'s dev/prod separation, and invites a
future dev-only bump to silently change runtime behavior. Moving them to the
`prod` catalog makes the manifest tell the truth.

## Current state

- `packages/slidev/package.json` — inside `"dependencies"` (block begins at
  `:51`, `"devDependencies"` begins at `:124`):
  ```json
  "postcss-nested": "catalog:dev",   // line 96
  "vitefu": "catalog:dev",           // line 119
  ```
  Both are imported at runtime:
  - `postcss-nested` → `packages/slidev/node/vite/extendConfig.ts:121`
  - `vitefu` (`findClosestPkgJsonPath`, `findDepPkgJsonPath`) → `packages/slidev/node/resolver.ts:14`, `packages/slidev/node/vite/monacoTypes.ts:7`
- Catalog definitions in `pnpm-workspace.yaml`:
  - `postcss-nested: ^7.0.2` is at `pnpm-workspace.yaml:57` (under `dev:`),
    `vitefu: ^1.1.3` is at `pnpm-workspace.yaml:71` (under `dev:`). If the exact
    line numbers have shifted, locate them by key under the `dev:` block.
  - `prod` catalog is the block beginning at `pnpm-workspace.yaml:119`.
- Note: `packages/slidev/package.json:106` also has `"typescript": "catalog:dev"`
  in `dependencies`. Leave that as-is — TypeScript is a legitimately dev-catalog
  pin used broadly; this plan is only about the two runtime-imported libs above.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install (re-resolves catalogs) | `pnpm install` | exit 0, lockfile stable |
| Build | `pnpm build` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `pnpm-workspace.yaml` (move two entries between catalog sections)
- `packages/slidev/package.json` (repoint two `catalog:dev` → `catalog:prod`)

**Out of scope**:
- `typescript`'s catalog placement.
- Any version bump (keep `postcss-nested: ^7.0.2`, `vitefu: ^1.1.3`).
- Any other package's manifest.

## Git workflow

- Branch: `deps/catalog-runtime-fix`.
- Conventional commit: `chore(deps): move runtime deps to prod catalog`.
- Do NOT push/PR unless instructed.

## Steps

### Step 1: Move the two entries into the `prod` catalog

In `pnpm-workspace.yaml`, remove `postcss-nested: ^7.0.2` and `vitefu: ^1.1.3`
from the `dev:` catalog block and add them (same versions) to the `prod:` block,
keeping the block's alphabetical ordering.

**Verify**: `pnpm dlx js-yaml pnpm-workspace.yaml` parses; the two keys now
appear under `prod:` and not `dev:`.

### Step 2: Repoint the dependency references

In `packages/slidev/package.json`, change:
```json
"postcss-nested": "catalog:prod",
"vitefu": "catalog:prod",
```

**Verify**: `grep -n "postcss-nested\|vitefu" packages/slidev/package.json`
shows both as `catalog:prod`.

### Step 3: Re-resolve and build

**Verify**: `pnpm install` exits 0 and the resolved versions of `postcss-nested`
and `vitefu` are unchanged in `pnpm-lock.yaml` (only their catalog attribution
moves). Then `pnpm build` exits 0.

## Test plan

- No unit tests. Verification: `pnpm install` produces no version change for the
  two packages (diff `pnpm-lock.yaml` — the installed versions must be identical,
  only catalog metadata differs) and `pnpm build` passes.

## Done criteria

- [ ] `postcss-nested` and `vitefu` are under the `prod:` catalog in `pnpm-workspace.yaml`
- [ ] `packages/slidev/package.json` references both as `catalog:prod`
- [ ] `pnpm install` exits 0; resolved versions of both packages are unchanged in the lockfile
- [ ] `pnpm build` exits 0
- [ ] No other manifests changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Moving the catalog entry changes the resolved version of either package in the
  lockfile (indicates another consumer pins a different range).
- Either package turns out to be referenced via `catalog:dev` by another
  workspace package that genuinely needs the dev pin.

## Maintenance notes

- Reviewer: confirm the lockfile diff only re-attributes the catalog, no version churn.
- Follow-up (not this plan): audit other packages for the same dev/prod catalog
  mismatch on runtime deps.
