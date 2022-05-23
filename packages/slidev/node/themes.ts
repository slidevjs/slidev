import prompts from 'prompts'
import { parseNi, run } from '@antfu/ni'
import isInstalledGlobally from 'is-installed-globally'
import { underline } from 'kolorist'
import fs from 'fs-extra'
import type { SlidevThemeMeta } from '@slidev/types'
import { satisfies } from 'semver'
import { version } from '../package.json'
import { packageExists } from './utils'
import { isPath } from './options'

const officialThemes: Record<string, string> = {
  'none': '',
  'default': '@slidev/theme-default',
  'seriph': '@slidev/theme-seriph',
  'apple-basic': '@slidev/theme-apple-basic',
  'shibainu': '@slidev/theme-shibainu',
  'bricks': '@slidev/theme-bricks',
}

export async function getThemeMeta(name: string, path: string) {
  if (!fs.existsSync(path))
    return {}

  if (path) {
    const { slidev = {}, engines = {} } = await fs.readJSON(path)

    if (engines.slidev && !satisfies(version, engines.slidev))
      throw new Error(`[slidev] theme "${name}" requires Slidev version range "${engines.slidev}" but found "${version}"`)

    return slidev as SlidevThemeMeta
  }
  return undefined
}

export function resolveThemeName(name: string) {
  if (!name || name === 'none')
    return ''
  if (name.startsWith('@slidev/theme-') || name.startsWith('slidev-theme-'))
    return name
  if (isPath(name))
    return name

  // search for local packages first
  if (packageExists(`@slidev/theme-${name}`))
    return `@slidev/theme-${name}`
  if (packageExists(`slidev-theme-${name}`))
    return `slidev-theme-${name}`
  if (packageExists(name))
    return name

  // fallback to prompt install
  if (officialThemes[name] != null)
    return officialThemes[name]
  if (name.indexOf('@') === 0 && name.includes('/'))
    return name
  return `slidev-theme-${name}`
}

export async function promptForThemeInstallation(name: string) {
  name = resolveThemeName(name)
  if (!name)
    return name

  if (isPath(name) || packageExists(name))
    return name

  const { confirm } = await prompts({
    name: 'confirm',
    initial: 'Y',
    type: 'confirm',
    message: `The theme "${name}" was not found ${underline(isInstalledGlobally ? 'globally' : 'in your project')}, do you want to install it now?`,
  })

  if (!confirm)
    return false

  if (isInstalledGlobally)
    await run(parseNi, ['-g', name])
  else
    await run(parseNi, [name])

  return name
}
