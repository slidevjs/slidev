import fs from 'fs-extra'
import { satisfies } from 'semver'
import type { SlidevConfig } from '@slidev/types'
import { version } from '../package.json'
import { packageExists, resolveImportPath } from './utils'
import { isPath } from './options'

export async function getPackageJson(root: string): Promise<Record<string, any>> {
  try {
    const file = resolveImportPath(`${root}/package.json`, true)
    if (file && fs.existsSync(file))
      return await fs.readJSON(file)
    return {}
  }
  catch (e) {
    return {}
  }
}

export async function getAddons(userRoot: string, config: SlidevConfig): Promise<string[]> {
  const { slidev = {} } = await getPackageJson(userRoot)
  const configAddons = Array.isArray(config.addons) ? config.addons : []
  const addons = configAddons.concat(Array.isArray(slidev?.addons) ? slidev.addons : [])
  return (await getRecursivePlugins(addons.map(resolvePluginName), 3)).filter(Boolean)
}

export async function getRecursivePlugins(addons: string[], depth: number): Promise<string[]> {
  const addonsArray = await Promise.all(addons.map(async (addon) => {
    const { slidev = {}, engines = {} } = await getPackageJson(addon)
    checkEngine(addon, engines)

    let addons = Array.isArray(slidev?.addons) ? slidev.addons : []
    if (addons.length > 0 && depth)
      addons = await getRecursivePlugins(addons.map(resolvePluginName), depth - 1)
    addons.push(addon)

    return addons
  }))
  return addonsArray.flat()
}

export async function checkEngine(name: string, engines: { slidev?: string }) {
  if (engines.slidev && !satisfies(version, engines.slidev))
    throw new Error(`[slidev] addon "${name}" requires Slidev version range "${engines.slidev}" but found "${version}"`)
}

export function resolvePluginName(name: string) {
  if (!name)
    return ''
  if (isPath(name))
    return name
  if (packageExists(`slidev-addon-${name}`))
    return `slidev-addon-${name}`
  return name
}
