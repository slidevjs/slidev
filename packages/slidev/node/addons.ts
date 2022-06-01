import fs from 'fs-extra'
import { satisfies } from 'semver'
import type { SlidevConfig } from '@slidev/types'
import { version } from '../package.json'
import { packageExists, resolveImportPath } from './utils'
import { isPath } from './options'

export function getPackageJson(root: string): Record<string, any> {
  const file = resolveImportPath(`${root}/package.json`, true)
  if (file && fs.existsSync(file))
    return fs.readJSON(file)
  return {}
}

export async function getAddons(userRoot: string, config: SlidevConfig): Promise<string[]> {
  const { slidev = {} } = await getPackageJson(userRoot)
  const configAddons = config.addons instanceof Array ? config.addons : []
  const addons = configAddons.concat(slidev?.addons instanceof Array ? slidev.addons : [])
  return getRecursivePlugins(addons.map(resolvePluginName))
}

export async function getRecursivePlugins(addons: string[]): Promise<string[]> {
  const addonsArray = await Promise.all(addons.map(async (addon) => {
    const { slidev = {}, engines = {} } = await getPackageJson(addon)
    checkEngine(addon, engines)

    let addons = slidev?.addons instanceof Array ? slidev.addons : []
    if (addons.length > 0)
      addons = await getRecursivePlugins(addons.map(resolvePluginName))
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
