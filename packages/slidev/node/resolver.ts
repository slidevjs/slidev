import type { RootsInfo } from '@slidev/types'
import * as fs from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseNi, run } from '@antfu/ni'
import { ensurePrefix, slash } from '@antfu/utils'
import { underline, yellow } from 'ansis'
import globalDirs from 'global-directory'
import { resolvePath } from 'mlly'
import prompts from 'prompts'
import { resolveGlobal } from 'resolve-global'
import { findClosestPkgJsonPath, findDepPkgJsonPath } from 'vitefu'

const cliRoot = fileURLToPath(new URL('..', import.meta.url))

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
  const yarnPath = join(globalDirs.yarn.packages, name)
  if (fs.existsSync(`${yarnPath}/package.json`))
    return yarnPath
  const npmPath = join(globalDirs.npm.packages, name)
  if (fs.existsSync(`${npmPath}/package.json`))
    return npmPath
  if (ensure)
    throw new Error(`Failed to resolve global package "${name}"`)
}

export async function resolveEntry(entryRaw: string) {
  if (!fs.existsSync(entryRaw) && !entryRaw.endsWith('.md') && !/[/\\]/.test(entryRaw))
    entryRaw += '.md'
  const entry = resolve(entryRaw)
  if (!fs.existsSync(entry)) {
    const { create } = await prompts({
      name: 'create',
      type: 'confirm',
      initial: 'Y',
      message: `Entry file ${yellow(`"${entry}"`)} does not exist, do you want to create it?`,
    })
    if (create)
      fs.copyFileSync(resolve(cliRoot, 'template.md'), entry)
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

    // definitely a package name
    if (name.startsWith(`@slidev/${type}-`) || name.startsWith(`slidev-${type}-`)) {
      const pkgRoot = await findPkgRoot(name, importer)
      if (!pkgRoot)
        await promptForInstallation(name)
      return [name, await findPkgRoot(name, importer, true)]
    }

    // search for local packages first
    {
      const possiblePkgNames = [
        `@slidev/${type}-${name}`,
        `slidev-${type}-${name}`,
        name,
      ]

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

function getUserPkgJson(userRoot: string) {
  const path = resolve(userRoot, 'package.json')
  if (fs.existsSync(path))
    return JSON.parse(fs.readFileSync(path, 'utf-8')) as Record<string, any>
  return {}
}

// npm: https://docs.npmjs.com/cli/v7/using-npm/workspaces#installing-workspaces
// yarn: https://classic.yarnpkg.com/en/docs/workspaces/#toc-how-to-use-it
function hasWorkspacePackageJSON(root: string): boolean {
  const path = join(root, 'package.json')
  try {
    fs.accessSync(path, fs.constants.R_OK)
  }
  catch {
    return false
  }
  const content = JSON.parse(fs.readFileSync(path, 'utf-8')) || {}
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

  return ROOT_FILES.some(file => fs.existsSync(join(root, file)))
}

/**
 * Search up for the nearest workspace root
 */
function searchForWorkspaceRoot(
  current: string,
  root = current,
): string {
  if (hasRootFile(current))
    return current
  if (hasWorkspacePackageJSON(current))
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
      || (await import('is-installed-globally')).default
  const clientRoot = await findPkgRoot('@slidev/client', cliRoot, true)
  const closestPkgRoot = dirname(await findClosestPkgJsonPath(userRoot) || userRoot)
  const userPkgJson = getUserPkgJson(closestPkgRoot)
  const userWorkspaceRoot = searchForWorkspaceRoot(closestPkgRoot)
  rootsInfo = {
    cliRoot,
    clientRoot,
    userRoot,
    userPkgJson,
    userWorkspaceRoot,
  }
  return rootsInfo
}
