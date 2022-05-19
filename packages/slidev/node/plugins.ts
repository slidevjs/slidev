import fs from 'fs-extra'
import { satisfies } from 'semver'
import type { SlidevConfig } from '@slidev/types'
import { version } from '../package.json'
import { packageExists, resolveImportPath } from './utils'
import { isPath } from './options'

export function getPackageJson(root: string) {
  return fs.readJSON(resolveImportPath(`${root}/package.json`, true))
}

export async function getPlugins(userRoot: string, config: SlidevConfig): Promise<string[]> {
  const { slidev = {} } = await getPackageJson(userRoot)
  const plugins = config.plugins.concat(slidev?.plugins || [])
  return getRecursivePlugins(plugins.map(resolvePluginName))
}

export async function getRecursivePlugins(plugins: string[]): Promise<string[]> {
  const pluginsArray = await Promise.all(plugins.map(async (plugin) => {
    const { slidev = {}, engines = {} } = await getPackageJson(plugin)
    checkEngine(plugin, engines)

    let plugins = slidev?.plugins || []
    if (plugins.length > 0)
      plugins = await getRecursivePlugins(plugins.map(resolvePluginName))
    plugins.push(plugin)

    return plugins
  }))
  return pluginsArray.flat()
}

export async function checkEngine(name: string, engines: { slidev?: string }) {
  if (engines.slidev && !satisfies(version, engines.slidev))
    throw new Error(`[slidev] plugin "${name}" requires Slidev version range "${engines.slidev}" but found "${version}"`)
}

export function resolvePluginName(name: string) {
  if (!name)
    return ''
  if (isPath(name))
    return name
  if (packageExists(`slidev-plugin-${name}`))
    return `slidev-plugin-${name}`
  return name
}
