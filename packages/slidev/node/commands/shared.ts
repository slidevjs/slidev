import type { ResolvedSlidevOptions, SlidevData, SlidevServerOptions } from '@slidev/types'
import type { ConfigEnv, InlineConfig } from 'vite'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import MarkdownIt from 'markdown-it'
import { loadConfigFromFile, mergeConfig } from 'vite'
import markdownItLink from '../syntax/markdown-it/markdown-it-link'
import { stringifyMarkdownTokens } from '../utils'
import { ViteSlidevPlugin } from '../vite'

export const sharedMd = MarkdownIt({ html: true })
sharedMd.use(markdownItLink)

export function getSlideTitle(data: SlidevData) {
  const tokens = sharedMd.parseInline(data.config.title, {})
  const title = stringifyMarkdownTokens(tokens)
  const slideTitle = data.config.titleTemplate.replace('%s', title)
  return slideTitle === 'Slidev - Slidev' ? 'Slidev' : slideTitle
}

export async function resolveViteConfigs(
  options: ResolvedSlidevOptions,
  baseConfig: InlineConfig,
  overrideConfigs: InlineConfig,
  command: 'serve' | 'build',
  serverOptions?: SlidevServerOptions,
) {
  const configEnv: ConfigEnv = {
    mode: command === 'build' ? 'production' : 'development',
    command,
  }
  // Merge theme & addon & user configs
  const files = options.roots.map(i => join(i, 'vite.config.ts'))

  for (const file of files) {
    if (!existsSync(file))
      continue
    const viteConfig = await loadConfigFromFile(configEnv, file)
    if (!viteConfig?.config)
      continue
    baseConfig = mergeConfig(baseConfig, viteConfig.config)
  }

  baseConfig = mergeConfig(baseConfig, overrideConfigs)

  // Merge common overrides
  baseConfig = mergeConfig(baseConfig, {
    configFile: false,
    root: options.userRoot,
    plugins: await ViteSlidevPlugin(options, baseConfig.slidev, serverOptions),
    define: {
      // Fixes Vue production mode breaking PDF Export #1245
      __VUE_PROD_DEVTOOLS__: false,
    },
  } satisfies InlineConfig)

  return baseConfig
}
