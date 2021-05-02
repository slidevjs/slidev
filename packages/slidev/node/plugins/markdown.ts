import Markdown from 'vite-plugin-md'
// @ts-expect-error
import mila from 'markdown-it-link-attributes'
import { Plugin } from 'vite'
import type { Options as ShikiOption } from 'markdown-it-shiki'
import type MarkdownIt from 'markdown-it'
import base64 from 'js-base64'
import { isTruthy } from '@antfu/utils'
import { ResolvedSlidevOptions, SlidevPluginOptions } from '../options'
import { loadSetups } from './setupNode'

export async function createMarkdownPlugin(
  { data: { config }, roots, mode }: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
): Promise<Plugin> {
  const setups: ((md: MarkdownIt) => void)[] = []

  if (config.highlighter === 'shiki') {
    const { default: Shiki, resolveOptions } = await import('markdown-it-shiki')
    const { getHighlighter } = await import('shiki')
    const shikiOptions: ShikiOption = await loadSetups(roots, 'shiki.ts', {}, {
      theme: {
        dark: 'min-dark',
        light: 'min-light',
      },
    }, false)
    const { langs, themes } = resolveOptions(shikiOptions)
    shikiOptions.highlighter = await getHighlighter({ themes, langs })

    setups.push(md => md.use(Shiki, shikiOptions))
  }
  else {
    const { default: Prism } = await import('markdown-it-prism')
    setups.push(md => md.use(Prism))
  }

  return Markdown({
    wrapperClasses: '',
    headEnabled: false,
    markdownItOptions: {
      quotes: '""\'\'',
      html: true,
      xhtmlOut: true,
      linkify: true,
    },
    markdownItSetup(md) {
      md.use(mila, {
        attrs: {
          target: '_blank',
          rel: 'noopener',
        },
      })

      setups.forEach(i => i(md))
    },
    transforms: {
      before: (config.monaco === true || config.monaco === mode)
        ? transformMarkdownMonaco
        : truncateMancoMark,
    },
    ...mdOptions,
  })
}

export function transformMarkdownMonaco(md: string) {
  const typeModules = new Set<string>()

  // transform monaco
  md = md.replace(/\n```(\w+?){monaco([\w:,-]*)}[\s\n]*([\s\S]+?)\n```/mg, (full, lang = 'ts', options: string, code: string) => {
    options = options || ''
    lang = lang.trim()
    if (lang === 'ts' || lang === 'typescript') {
      Array.from(code.matchAll(/\s+from\s+(["'])([\/\w@-]+)\1/g))
        .map(i => i[2])
        .filter(isTruthy)
        .map(i => typeModules.add(i))
    }
    const encoded = base64.encode(code, true)
    return `<Monaco :code="'${encoded}'" lang="${lang}" :readonly="${options.includes('readonly')}" />`
  })

  // types auto discovery for TypeScript monaco
  if (typeModules.size)
    md += `\n<script setup>\n${Array.from(typeModules).map(i => `import('/@slidev-monaco-types/${i}')`).join('\n')}\n</script>\n`

  return md
}

export function truncateMancoMark(code: string) {
  return code.replace(/{monaco.*?}/g, '')
}
