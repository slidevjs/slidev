import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import type { Theme } from '@unocss/preset-uno'
import type { UserConfig } from '@unocss/core'
import { mergeConfigs } from 'unocss'
import type { ResolvedSlidevOptions, UnoSetup } from '@slidev/types'
import { loadSetups } from '../setups/load'
import { loadModule } from '../utils'

export default async function setupUnocss(
  { clientRoot, roots, data }: ResolvedSlidevOptions,
) {
  function loadFileConfigs(root: string): UserConfig<Theme>[] {
    return [
      resolve(root, 'uno.config.ts'),
      resolve(root, 'unocss.config.ts'),
    ].map((i) => {
      if (!existsSync(i))
        return undefined
      const loaded = loadModule(i)
      return 'default' in loaded ? loaded.default : loaded
    })
  }

  const configs = [
    ...loadFileConfigs(clientRoot),
    ...await loadSetups<UnoSetup>(roots, 'unocss.ts', [], loadFileConfigs),
  ].filter(Boolean) as UserConfig<Theme>[]

  const config = mergeConfigs(configs)

  config.theme ||= {}
  config.theme.fontFamily ||= {}
  config.theme.fontFamily.sans ||= data.config.fonts.sans.join(',')
  config.theme.fontFamily.mono ||= data.config.fonts.mono.join(',')
  config.theme.fontFamily.serif ||= data.config.fonts.serif.join(',')

  return config
}
