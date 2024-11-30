import type { ResolvedSlidevOptions, UnoSetup } from '@slidev/types'
import type { UserConfig } from '@unocss/core'
import type { Theme } from '@unocss/preset-uno'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mergeConfigs, presetIcons } from 'unocss'
import { loadSetups } from '../setups/load'
import { loadModule } from '../utils'

export default async function setupUnocss(
  { clientRoot, roots, data, utils }: ResolvedSlidevOptions,
) {
  async function loadFileConfigs(root: string): Promise<UserConfig<Theme>[]> {
    return (await Promise
      .all([
        resolve(root, 'uno.config.ts'),
        resolve(root, 'unocss.config.ts'),
      ]
        .map(async (i) => {
          if (!existsSync(i))
            return undefined
          const loaded = await loadModule(i) as UserConfig<Theme> | { default: UserConfig<Theme> }
          return 'default' in loaded ? loaded.default : loaded
        })))
      .filter(x => !!x)
  }

  const configs = [
    {
      presets: [
        presetIcons({
          collectionsNodeResolvePath: utils.iconsResolvePath,
          collections: {
            slidev: {
              logo: () => readFileSync(resolve(clientRoot, 'assets/logo.svg'), 'utf-8'),
            },
          },
        }),
      ],
    },
    ...await loadFileConfigs(clientRoot),
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
