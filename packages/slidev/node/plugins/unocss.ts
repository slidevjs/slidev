import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { uniq } from '@antfu/utils'
import type { Theme } from '@unocss/preset-uno'
import type { UserConfig } from '@unocss/core'
import { mergeConfigs } from 'unocss'
import jiti from 'jiti'
import UnoCSS from 'unocss/vite'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '..'
import { loadSetups } from './setupNode'
import { extractorFrontmatterClass } from './extractor'

export async function createUnocssPlugin(
  { themeRoots, addonRoots, clientRoot, roots, userRoot, data }: ResolvedSlidevOptions,
  { unocss: unoOptions = {} }: SlidevPluginOptions,
) {
  const configFiles = uniq([
    resolve(userRoot, 'uno.config.ts'),
    resolve(userRoot, 'unocss.config.ts'),
    ...themeRoots.map(i => `${i}/uno.config.ts`),
    ...themeRoots.map(i => `${i}/unocss.config.ts`),
    ...addonRoots.map(i => `${i}/uno.config.ts`),
    ...addonRoots.map(i => `${i}/unocss.config.ts`),
    resolve(clientRoot, 'uno.config.ts'),
    resolve(clientRoot, 'unocss.config.ts'),
  ]).filter(i => existsSync(i))

  const configs = configFiles
    .map((i) => {
      const loaded = jiti(__filename)(i)
      const config = 'default' in loaded ? loaded.default : loaded
      return config
    })
    .filter(Boolean) as UserConfig<Theme>[]

  configs.reverse()

  let config = mergeConfigs([
    {
      content: {
        pipeline: {
          include: [
            /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
            /\.(frontmatter)/,
          ],
        },
      },
      extractors: [
        extractorFrontmatterClass(),
      ],
    },
    ...configs,
    unoOptions as UserConfig<Theme>,
  ])

  config = await loadSetups(roots, 'unocss.ts', {}, config, true)

  config.theme ||= {}
  config.theme.fontFamily ||= {}
  config.theme.fontFamily.sans ||= data.config.fonts.sans.join(',')
  config.theme.fontFamily.mono ||= data.config.fonts.mono.join(',')
  config.theme.fontFamily.serif ||= data.config.fonts.serif.join(',')

  return UnoCSS({
    configFile: false,
    configDeps: configFiles,
    ...config as any,
  })
}
