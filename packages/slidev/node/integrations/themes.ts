import type { SlidevThemeMeta } from '@slidev/types'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { join } from 'node:path'
import { satisfies } from 'semver'
import { version } from '../../package.json'
import { createResolver } from '../resolver'

const officialThemes: Record<string, string> = {
  'none': '',
  'default': '@slidev/theme-default',
  'seriph': '@slidev/theme-seriph',
  'apple-basic': '@slidev/theme-apple-basic',
  'shibainu': '@slidev/theme-shibainu',
  'bricks': '@slidev/theme-bricks',
}

export const resolveTheme = createResolver('theme', officialThemes)

export async function getThemeMeta(name: string, root: string) {
  const path = join(root, 'package.json')
  if (!existsSync(path))
    return {}

  const { slidev = {}, engines = {} } = JSON.parse(await fs.readFile(path, 'utf-8'))

  if (engines.slidev && !satisfies(version, engines.slidev, { includePrerelease: true }))
    throw new Error(`[slidev] theme "${name}" requires Slidev version range "${engines.slidev}" but found "${version}"`)

  return slidev as SlidevThemeMeta
}
