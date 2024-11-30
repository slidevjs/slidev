import { resolve } from 'node:path'
import fs from 'fs-extra'
import { satisfies } from 'semver'
import { version } from '../../package.json'
import { createResolver, getRoots } from '../resolver'

export async function resolveAddons(addonsInConfig: string[]) {
  const { userRoot, userPkgJson } = await getRoots()
  const resolved: string[] = []

  const resolveAddonNameAndRoot = createResolver('addon', {})

  async function resolveAddon(name: string, parent: string) {
    const [, pkgRoot] = await resolveAddonNameAndRoot(name, parent)
    if (!pkgRoot)
      return
    resolved.push(pkgRoot)
    const { slidev = {}, engines = {} } = await fs.readJSON(resolve(pkgRoot, 'package.json'))

    if (engines.slidev && !satisfies(version, engines.slidev, { includePrerelease: true }))
      throw new Error(`[slidev] addon "${name}" requires Slidev version range "${engines.slidev}" but found "${version}"`)

    if (Array.isArray(slidev.addons))
      await Promise.all(slidev.addons.map((addon: string) => resolveAddon(addon, pkgRoot)))
  }

  if (Array.isArray(addonsInConfig))
    await Promise.all(addonsInConfig.map((addon: string) => resolveAddon(addon, userRoot)))
  if (Array.isArray(userPkgJson.slidev?.addons))
    await Promise.all(userPkgJson.slidev.addons.map((addon: string) => resolveAddon(addon, userRoot)))

  return resolved
}
