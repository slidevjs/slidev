import { existsSync, promises as fs } from 'fs'
import { join } from 'path'
import { uniq } from '@antfu/utils'
import { loadConfigFromFile, mergeConfig } from 'vite'
import type { ConfigEnv, InlineConfig } from 'vite'
import type { ResolvedSlidevOptions } from './options'
import { generateGoogleFontsUrl, toAtFS } from './utils'

export async function getIndexHtml({ clientRoot, themeRoots, addonRoots, data, userRoot }: ResolvedSlidevOptions): Promise<string> {
  let main = await fs.readFile(join(clientRoot, 'index.html'), 'utf-8')
  let head = ''
  let body = ''

  head += `<link rel="icon" href="${data.config.favicon}">`

  const roots = uniq([
    ...themeRoots,
    ...addonRoots,
    userRoot,
  ])

  for (const root of roots) {
    const path = join(root, 'index.html')
    if (!existsSync(path))
      continue

    const index = await fs.readFile(path, 'utf-8')

    head += `\n${(index.match(/<head>([\s\S]*?)<\/head>/im)?.[1] || '').trim()}`
    body += `\n${(index.match(/<body>([\s\S]*?)<\/body>/im)?.[1] || '').trim()}`
  }

  if (data.features.tweet)
    body += '\n<script async src="https://platform.twitter.com/widgets.js"></script>'

  if (data.config.fonts.webfonts.length && data.config.fonts.provider !== 'none')
    head += `\n<link rel="stylesheet" href="${generateGoogleFontsUrl(data.config.fonts)}" type="text/css">`

  main = main
    .replace('__ENTRY__', toAtFS(join(clientRoot, 'main.ts')))
    .replace('<!-- head -->', head)
    .replace('<!-- body -->', body)

  return main
}

export async function mergeViteConfigs({ addonRoots, themeRoots }: ResolvedSlidevOptions, viteConfig: InlineConfig, config: InlineConfig, command: 'serve' | 'build') {
  const configEnv: ConfigEnv = {
    mode: 'development',
    command,
  }

  const files = uniq([
    ...themeRoots,
    ...addonRoots,
  ]).map(i => join(i, 'vite.config.ts'))

  for await (const file of files) {
    if (!existsSync(file))
      continue
    const viteConfig = await loadConfigFromFile(configEnv, file)
    if (!viteConfig?.config)
      continue
    config = mergeConfig(config, viteConfig.config)
  }

  return mergeConfig(viteConfig, config)
}
