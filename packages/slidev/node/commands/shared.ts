import type { ResolvedSlidevOptions, SlidevData, SlidevServerOptions } from '@slidev/types'
import type { ConfigEnv, InlineConfig } from 'vite'
import MarkdownExit from 'markdown-exit'
import { loadConfigFromFile, mergeConfig } from 'vite'
import { resolveSourceFiles } from '../resolver'
import markdownItLink from '../syntax/markdown-it/markdown-it-link'
import { stringifyMarkdownTokens } from '../utils'
import { ViteSlidevPlugin } from '../vite'

export const sharedMd = MarkdownExit({ html: true })
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
  // Merge theme & addon & user configs
  const configEnv: ConfigEnv = {
    mode: command === 'build' ? 'production' : 'development',
    command,
  }
  const files = resolveSourceFiles(options.roots, 'vite.config')
  const configs = await Promise.all(files.map(file => loadConfigFromFile(configEnv, file)))
  for (const config of configs) {
    if (!config?.config)
      continue
    baseConfig = mergeConfig(baseConfig, config.config)
  }

  // Merge command-specific overrides
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
