import type { RootsInfo } from '@slidev/types'
import { existsSync, lstatSync, readdirSync, readlinkSync } from 'node:fs'
import { copyFile, readFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseNi, run } from '@antfu/ni'
import { ensurePrefix, slash } from '@antfu/utils'
import { underline, yellow } from 'ansis'
import globalDirs from 'global-directory'
import { resolvePath } from 'mlly'
import { dirname, join, relative, resolve, sep } from 'pathe'
import prompts from 'prompts'
import { resolveGlobal } from 'resolve-global'
import { findClosestPkgJsonPath, findDepPkgJsonPath } from 'vitefu'

const RE_PATH_SEPARATOR = /[/\\]/
const RE_SAFE_PKG_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

const cliRoot = fileURLToPath(new URL('..', import.meta.url))

/**
 * Detect the `node_modules/` directory the running slidev binary was
 * dispatched from. The simple `findDepPkgJsonPath(name, cliRoot)` walk fails
 * in pnpm v11+ global installs because `cliRoot` is the realpath inside the
 * content-addressable store, with no path back to the install directory. The
 * invocation path (`process.argv[1]`), however, is one of:
 *
 * - `{PNPM_HOME}/v11/{hash}/node_modules/@slidev/cli/bin/slidev.mjs` — pnpm
 *   v11 globals dispatch through a shell shim in `{PNPM_HOME}/bin/` that exec's
 *   `node` with this argv[1].
 * - `{globals}/node_modules/@slidev/cli/bin/slidev.mjs` — npm/yarn globals,
 *   where the bin is a fs symlink and the resolved script path keeps the
 *   `node_modules` segment.
 * - `./node_modules/.bin/slidev` — local project, where Node resolves the
 *   `.bin` symlink before populating argv[1].
 *
 * Returns the trailing `node_modules` directory of that path, or `undefined`
 * if `argv1` doesn't pass through one.
 *
 * Exported for tests.
 */
export function findInvocationNodeModulesPath(argv1: string | undefined): string | undefined {
  if (!argv1)
    return undefined
  // Direct hit on the literal path passed to Node.
  const direct = resolve(argv1)
  const segment = `${sep}node_modules${sep}`
  const directIdx = direct.lastIndexOf(segment)
  if (directIdx >= 0)
    return direct.slice(0, directIdx + 1 + 'node_modules'.length)
  // Fall back to following an fs symlink chain (covers the legacy `.bin`
  // symlink layout where argv[1] is a path *to* the symlink itself).
  let current = direct
  for (let i = 0; i < 16; i++) {
    let stat
    try {
      stat = lstatSync(current)
    }
    catch {
      return undefined
    }
    if (!stat.isSymbolicLink())
      return undefined
    const target = readlinkSync(current)
    // `readlinkSync` returns the target verbatim — possibly with the *wrong*
    // separator on Windows (e.g. a target written with `/` by a cross-platform
    // tool). Resolve through the symlink's directory in every case so the
    // separator-sensitive `node_modules` scan below sees a platform-normalized
    // path.
    current = resolve(dirname(current), target)
    const idx = current.lastIndexOf(segment)
    if (idx >= 0)
      return current.slice(0, idx + 1 + 'node_modules'.length)
  }
  return undefined
}

/**
 * Candidate `node_modules` directories to search when slidev is installed
 * globally. Always includes the invocation's own `node_modules` (the install
 * group `@slidev/cli` lives in), plus every sibling install group's
 * `node_modules` so cross-group lookups can succeed.
 *
 * pnpm v11 lays globals out as `{root}/v11/{hash}/node_modules/...`; each
 * `pnpm add -g <pkg>` invocation creates its own `{hash}` directory even
 * when multiple packages are listed in one call. Walking the parent of the
 * cli's install group lets us discover packages that landed in sibling
 * groups (e.g. a theme installed alongside `@slidev/cli`).
 *
 * Exported for tests.
 */
export function computeInvocationSearchPaths(ownNodeModules: string | undefined): string[] {
  if (!ownNodeModules)
    return []
  const paths = [ownNodeModules]
  const installDir = dirname(ownNodeModules)
  const globalRoot = dirname(installDir)
  if (!globalRoot || globalRoot === installDir)
    return paths
  let siblings: string[]
  try {
    siblings = readdirSync(globalRoot)
  }
  catch {
    return paths
  }
  for (const sib of siblings) {
    const sibInstall = join(globalRoot, sib)
    if (sibInstall === installDir)
      continue
    const sibNm = join(sibInstall, 'node_modules')
    try {
      if (lstatSync(sibNm).isDirectory())
        paths.push(sibNm)
    }
    catch { }
  }
  return paths
}

const invocationNodeModules = findInvocationNodeModulesPath(process.argv[1])
const invocationSearchPaths = computeInvocationSearchPaths(invocationNodeModules)

export const isInstalledGlobally: { value?: boolean } = {}

/**
 * Resolve path for import url on Vite client side
 */
export async function resolveImportUrl(id: string) {
  return toAtFS(await resolveImportPath(id, true))
}

export function toAtFS(path: string) {
  return `/@fs${ensurePrefix('/', slash(path))}`
}

/**
 * Find the actual path of the import. If Slidev is installed globally, it will also search globally.
 */
export async function resolveImportPath(importName: string, ensure: true): Promise<string>
export async function resolveImportPath(importName: string, ensure?: boolean): Promise<string | undefined>
export async function resolveImportPath(importName: string, ensure = false) {
  try {
    return await resolvePath(importName, {
      url: import.meta.url,
    })
  }
  catch { }

  if (isInstalledGlobally.value) {
    for (const nm of invocationSearchPaths) {
      try {
        return await resolvePath(importName, {
          url: pathToFileURL(`${nm}${sep}`),
        })
      }
      catch { }
    }
    try {
      return resolveGlobal(importName)
    }
    catch { }
  }

  if (ensure)
    throw new Error(`Failed to resolve package "${importName}"`)
}

/**
 * Find the root of the package. If Slidev is installed globally, it will also search globally.
 */
export async function findPkgRoot(dep: string, parent: string, ensure: true): Promise<string>
export async function findPkgRoot(dep: string, parent: string, ensure?: boolean): Promise<string | undefined>
export async function findPkgRoot(dep: string, parent: string, ensure = false) {
  const pkgJsonPath = await findDepPkgJsonPath(dep, parent)
  const path = pkgJsonPath ? dirname(pkgJsonPath) : isInstalledGlobally.value ? await findGlobalPkgRoot(dep, false) : undefined
  if (ensure && !path)
    throw new Error(`Failed to resolve package "${dep}"`)
  return path
}

export async function findGlobalPkgRoot(name: string, ensure: true): Promise<string>
export async function findGlobalPkgRoot(name: string, ensure?: boolean): Promise<string | undefined>
export async function findGlobalPkgRoot(name: string, ensure = false) {
  const localPath = await findDepPkgJsonPath(name, cliRoot)
  if (localPath)
    return dirname(localPath)
  for (const nm of invocationSearchPaths) {
    const direct = join(nm, ...name.split('/'), 'package.json')
    if (existsSync(direct))
      return dirname(direct)
    const walked = await findDepPkgJsonPath(name, nm)
    if (walked)
      return dirname(walked)
  }
  const yarnPath = join(globalDirs.yarn.packages, name)
  if (existsSync(`${yarnPath}/package.json`))
    return yarnPath
  const npmPath = join(globalDirs.npm.packages, name)
  if (existsSync(`${npmPath}/package.json`))
    return npmPath
  if (ensure)
    throw new Error(`Failed to resolve global package "${name}"`)
}

export async function resolveEntry(entryRaw: string) {
  if (!existsSync(entryRaw) && !entryRaw.endsWith('.md') && !RE_PATH_SEPARATOR.test(entryRaw))
    entryRaw += '.md'
  const entry = resolve(entryRaw)
  if (!existsSync(entry)) {
    // Check if stdin is available for prompts (i.e., is a TTY)
    if (!process.stdin.isTTY) {
      console.error(`Entry file "${entry}" does not exist and cannot prompt for confirmation`)
      process.exit(1)
    }
    const { create } = await prompts({
      name: 'create',
      type: 'confirm',
      initial: 'Y',
      message: `Entry file ${yellow(`"${entry}"`)} does not exist, do you want to create it?`,
    })
    if (create)
      await copyFile(resolve(cliRoot, 'template.md'), entry)
    else
      process.exit(0)
  }
  return slash(entry)
}

/**
 * Create a resolver for theme or addon
 */
export function createResolver(type: 'theme' | 'addon', officials: Record<string, string>) {
  async function promptForInstallation(pkgName: string) {
    // Check if stdin is available for prompts (i.e., is a TTY)
    if (!process.stdin.isTTY) {
      console.error(`The ${type} "${pkgName}" was not found and cannot prompt for installation`)
      process.exit(1)
    }

    const { confirm } = await prompts({
      name: 'confirm',
      initial: 'Y',
      type: 'confirm',
      message: `The ${type} "${pkgName}" was not found ${underline(isInstalledGlobally.value ? 'globally' : 'in your project')}, do you want to install it now?`,
    })

    if (!confirm)
      process.exit(1)

    if (isInstalledGlobally.value)
      await run(parseNi, ['-g', pkgName])
    else
      await run(parseNi, [pkgName])
  }

  return async function (name: string, importer: string): Promise<[name: string, root: string | null]> {
    const { userRoot } = await getRoots()

    if (name === 'none')
      return ['', null]

    // local path
    if (name[0] === '/')
      return [name, name]
    if (name.startsWith('@/'))
      return [name, resolve(userRoot, name.slice(2))]
    if (name[0] === '.' || (name[0] !== '@' && name.includes('/')))
      return [name, resolve(dirname(importer), name)]

    // Validate that the name is a safe npm package name before resolving
    if (!RE_SAFE_PKG_NAME.test(name))
      throw new Error(`Invalid ${type} name "${name}". Only valid npm package names are allowed.`)

    // search for local packages first
    {
      const possiblePkgNames = [name]

      if (!name.includes('/') && !name.startsWith('@')) {
        possiblePkgNames.unshift(
          `@slidev/${type}-${name}`,
          `slidev-${type}-${name}`,
        )
      }

      for (const pkgName of possiblePkgNames) {
        const pkgRoot = await findPkgRoot(pkgName, importer)
        if (pkgRoot)
          return [pkgName, pkgRoot]
      }
    }

    // fallback to prompt install
    const pkgName = officials[name] ?? (name[0] === '@' ? name : `slidev-${type}-${name}`)
    await promptForInstallation(pkgName)
    return [pkgName, await findPkgRoot(pkgName, importer, true)]
  }
}

async function getUserPkgJson(userRoot: string) {
  const path = resolve(userRoot, 'package.json')
  if (existsSync(path))
    return JSON.parse(await readFile(path, 'utf-8')) as Record<string, any>
  return {}
}

// npm: https://docs.npmjs.com/cli/v7/using-npm/workspaces#installing-workspaces
// yarn: https://classic.yarnpkg.com/en/docs/workspaces/#toc-how-to-use-it
async function hasWorkspacePackageJSON(root: string): Promise<boolean> {
  const path = join(root, 'package.json')
  if (!existsSync(path))
    return false
  const content = JSON.parse(await readFile(path, 'utf-8')) || {}
  return !!content.workspaces
}

function hasRootFile(root: string): boolean {
  // https://github.com/vitejs/vite/issues/2820#issuecomment-812495079
  const ROOT_FILES = [
    // '.git',

    // https://pnpm.js.org/workspaces/
    'pnpm-workspace.yaml',

    // https://rushjs.io/pages/advanced/config_files/
    // 'rush.json',

    // https://nx.dev/latest/react/getting-started/nx-setup
    // 'workspace.json',
    // 'nx.json'
  ]

  return ROOT_FILES.some(file => existsSync(join(root, file)))
}

/**
 * Search up for the nearest workspace root
 */
async function searchForWorkspaceRoot(
  current: string,
  root = current,
): Promise<string> {
  if (hasRootFile(current))
    return current
  if (await hasWorkspacePackageJSON(current))
    return current

  const dir = dirname(current)
  // reach the fs root
  if (!dir || dir === current)
    return root

  return searchForWorkspaceRoot(dir, root)
}

let rootsInfo: RootsInfo | null = null

export async function getRoots(entry?: string): Promise<RootsInfo> {
  if (rootsInfo)
    return rootsInfo
  if (!entry)
    throw new Error('[slidev] Cannot find roots without entry')
  const userRoot = dirname(entry)
  isInstalledGlobally.value
    = slash(relative(userRoot, process.argv[1])).includes('/.pnpm/')
      // pnpm v11 isolated globals don't expose a `.pnpm/` segment in argv[1]
      // and aren't detected by `is-installed-globally` (which only knows npm
      // and yarn). The cli's bin is symlinked into an install-group
      // `node_modules/` that's outside the user's workspace, so use that as
      // the global-mode signal.
      || (invocationNodeModules != null
        && slash(relative(userRoot, invocationNodeModules)).startsWith('..'))
      || (await import('is-installed-globally')).default
  const clientRoot = await findPkgRoot('@slidev/client', cliRoot, true)
  const closestPkgRoot = dirname(await findClosestPkgJsonPath(userRoot) || userRoot)
  const userPkgJson = await getUserPkgJson(closestPkgRoot)
  const userWorkspaceRoot = await searchForWorkspaceRoot(closestPkgRoot)
  rootsInfo = {
    cliRoot,
    clientRoot,
    userRoot,
    userPkgJson,
    userWorkspaceRoot,
  }
  return rootsInfo
}

export function resolveSourceFiles(
  roots: string[],
  subpath: string,
  extensions = ['.mjs', '.js', '.mts', '.ts'], // The same order as https://vite.dev/config/shared-options#resolve-extensions
) {
  const results: string[] = []
  for (const root of roots) {
    for (const ext of extensions) {
      const fullPath = join(root, subpath + ext)
      if (existsSync(fullPath)) {
        results.push(fullPath)
        break
      }
    }
  }
  return results
}
