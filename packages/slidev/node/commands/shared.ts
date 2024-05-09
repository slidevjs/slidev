import { existsSync, promises as fs } from 'node:fs'
import { join } from 'node:path'
import { loadConfigFromFile, mergeConfig, resolveConfig } from 'vite'
import type { ConfigEnv, InlineConfig } from 'vite'
import type { ResolvedSlidevOptions, SlidevData } from '@slidev/types'
import { isString } from 'unocss'
import MarkdownIt from 'markdown-it'
import { slash } from '@antfu/utils'
import markdownItLink from '../syntax/markdown-it/markdown-it-link'
import { generateGoogleFontsUrl, stringifyMarkdownTokens } from '../utils'
import { toAtFS } from '../resolver'
import { version } from '../../package.json'

export const sharedMd = MarkdownIt({ html: true })
sharedMd.use(markdownItLink)

export function getTitle(data: SlidevData) {
  if (isString(data.config.title)) {
    const tokens = sharedMd.parseInline(data.config.title, {})
    return stringifyMarkdownTokens(tokens)
  }
  return data.config.title
}

function escapeHtml(unsafe: unknown) {
  return JSON.stringify(
    String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;'),
  )
}

export async function getIndexHtml({ entry, clientRoot, roots, data }: ResolvedSlidevOptions): Promise<string> {
  let main = await fs.readFile(join(clientRoot, 'index.html'), 'utf-8')
  let head = ''
  let body = ''

  const { info, author, keywords } = data.headmatter
  head += [
    `<meta name="slidev:version" content="${version}">`,
    `<meta charset="slidev:entry" content="${slash(entry)}">`,
    `<link rel="icon" href="${data.config.favicon}">`,
    `<title>${getTitle(data)}</title>`,
    info && `<meta name="description" content=${escapeHtml(info)}>`,
    author && `<meta name="author" content=${escapeHtml(author)}>`,
    keywords && `<meta name="keywords" content=${escapeHtml(Array.isArray(keywords) ? keywords.join(', ') : keywords)}>`,
  ].filter(Boolean).join('\n')

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
