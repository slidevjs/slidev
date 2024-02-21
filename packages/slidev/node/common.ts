import { existsSync, promises as fs } from 'node:fs'
import { join } from 'node:path'
import { loadConfigFromFile, mergeConfig, resolveConfig } from 'vite'
import type { ConfigEnv, InlineConfig } from 'vite'
import type { ResolvedSlidevOptions } from './options'
import { generateGoogleFontsUrl } from './utils'
import { toAtFS } from './resolver'

export async function getIndexHtml({ clientRoot, roots, data }: ResolvedSlidevOptions): Promise<string> {
  let main = await fs.readFile(join(clientRoot, 'index.html'), 'utf-8')
  let head = ''
  let body = ''

  head += `<link rel="icon" href="${data.config.favicon}">`

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

export async function mergeViteConfigs(
  { roots, entry }: ResolvedSlidevOptions,
  viteConfig: InlineConfig,
  config: InlineConfig,
  command: 'serve' | 'build',
) {
  const configEnv: ConfigEnv = {
    mode: 'development',
    command,
  }
  // Merge theme & addon configs
  const files = roots.map(i => join(i, 'vite.config.ts'))

  for await (const file of files) {
    if (!existsSync(file))
      continue
    const viteConfig = await loadConfigFromFile(configEnv, file)
    if (!viteConfig?.config)
      continue
    config = mergeConfig(config, viteConfig.config)
  }

  // Merge viteConfig argument
  config = mergeConfig(config, viteConfig)

  // Merge local config (slidev options only)
  const localConfig = await resolveConfig({}, command, entry)
  config = mergeConfig(config, { slidev: localConfig.slidev || {} })

  return config
}
