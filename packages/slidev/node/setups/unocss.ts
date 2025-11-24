import type { ResolvedSlidevOptions, UnoSetup } from '@slidev/types'
import type { UserConfig } from '@unocss/core'
import type { Theme } from '@unocss/preset-uno'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import GeneratedTokens from '@slidev/client/.generated/unocss-tokens.ts'
import ClientUnoCssConfig from '@slidev/client/uno.config.ts'
import { mergeConfigs, presetIcons } from 'unocss'
import { loadSetups } from '../setups/load'
import { loadModule } from '../utils'

export default async function setupUnocss(
  { clientRoot, roots, data, utils }: ResolvedSlidevOptions,
) {
  function loadFileConfigs(root: string) {
    return [
      resolve(root, 'uno.config.ts'),
      resolve(root, 'unocss.config.ts'),
    ].map(async (i) => {
      if (!existsSync(i))
        return undefined
      const loaded = await loadModule(i) as UserConfig<Theme> | { default: UserConfig<Theme> }
      return 'default' in loaded ? loaded.default : loaded
    })
  }

  const configs = [
    {
      presets: [
        presetIcons({
          collectionsNodeResolvePath: utils.iconsResolvePath,
          collections: {
            slidev: {
              logo: () => readFile(resolve(clientRoot, 'assets/logo.svg'), 'utf-8'),
            },
          },
        }),
      ],
      safelist: GeneratedTokens,
    },
    ClientUnoCssConfig,
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
