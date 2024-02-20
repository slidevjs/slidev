import { resolve } from 'node:path'
import fs from 'fs-extra'
import { createResolver, getRoots } from './resolver'
import { checkEngine } from './utils'

export async function resolveAddons(addonsInConfig: string[]) {
  const { userRoot, userPkgJson } = await getRoots()
  const resolved: string[] = []

  const resolveAddonNameAndRoot = createResolver('addon', {})

  async function resolveAddon(name: string, parent: string) {
    const [, pkgRoot] = await resolveAddonNameAndRoot(name, parent)
    if (!pkgRoot)
      return
    resolved.push(pkgRoot)
    const { slidev, engines } = await fs.readJSON(resolve(pkgRoot, 'package.json'))
    checkEngine(name, engines)

    if (Array.isArray(slidev?.addons))
      await Promise.all(slidev.addons.map((addon: string) => resolveAddon(addon, pkgRoot)))
  }

  if (Array.isArray(addonsInConfig))
    await Promise.all(addonsInConfig.map((addon: string) => resolveAddon(addon, userRoot)))
  if (Array.isArray(userPkgJson.slidev?.addons))
    await Promise.all(userPkgJson.slidev.addons.map((addon: string) => resolveAddon(addon, userRoot)))

  return resolved
}
