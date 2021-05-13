import Markdown from 'vite-plugin-md'
import { Plugin } from 'vite'
import type { ShikiOptions } from '@slidev/types'
import type MarkdownIt from 'markdown-it'
import base64 from 'js-base64'
import { slash } from '@antfu/utils'
// @ts-expect-error
import mila from 'markdown-it-link-attributes'
// @ts-expect-error
import Katex from 'markdown-it-katex'
import { ResolvedSlidevOptions, SlidevPluginOptions } from '../options'
import { loadSetups } from './setupNode'
import Prism from './markdown-it-prism'
import Shiki, { resolveShikiOptions } from './markdown-it-shiki'

const DEFAULT_SHIKI_OPTIONS: ShikiOptions = {
  theme: {
    dark: 'min-dark',
    light: 'min-light',
  },
}

export async function createMarkdownPlugin(
  { data: { config }, roots, mode, entry }: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
): Promise<Plugin> {
  const setups: ((md: MarkdownIt) => void)[] = []
  const entryPath = slash(entry)

  if (config.highlighter === 'shiki') {
    const { getHighlighter } = await import('shiki')
    const shikiOptions: ShikiOptions = await loadSetups(roots, 'shiki.ts', {}, DEFAULT_SHIKI_OPTIONS, false)
    const { langs, themes } = resolveShikiOptions(shikiOptions)
    shikiOptions.highlighter = await getHighlighter({ themes, langs })
    setups.push(md => md.use(Shiki, shikiOptions))
  }
  else {
    setups.push(md => md.use(Prism))
  }

  return Markdown({
    wrapperClasses: '',
    headEnabled: false,
    frontmatter: false,
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

      md.use(Katex)

      setups.forEach(i => i(md))
    },
    transforms: {
      before(code, id) {
        if (id === entryPath)
          return ''

        const monaco = (config.monaco === true || config.monaco === mode)
          ? transformMarkdownMonaco
          : truncateMancoMark

        code = transformMermaid(code)
        code = monaco(code)
        code = transformHighlighter(code)
        code = transformPageCSS(code, id)

        return code
      },
    },
    ...mdOptions,
  })
}

export function transformMarkdownMonaco(md: string) {
  // transform monaco
  md = md.replace(/^```(\w+?)\s*{monaco([\w:,-]*)}[\s\n]*([\s\S]+?)^```/mg, (full, lang = 'ts', options: string, code: string) => {
    options = options || ''
    lang = lang.trim()
    const encoded = base64.encode(code, true)
    return `<Monaco :code="'${encoded}'" lang="${lang}" :readonly="${options.includes('readonly')}" />`
  })

  return md
}

export function truncateMancoMark(code: string) {
  return code.replace(/{monaco.*?}/g, '')
}

/**
 * Transform Monaco code block to component
 */
export function transformHighlighter(md: string) {
  return md.replace(/\n```(\w+?)\s*{([\d\w*,\|-]+)}[\s\n]*([\s\S]+?)\n```/mg, (full, lang = '', rangeStr: string, code: string) => {
    const ranges = rangeStr.split(/\|/g).map(i => i.trim())
    return `\n<CodeHighlightController :ranges='${JSON.stringify(ranges)}'>\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n</CodeHighlightController>`
  })
}

/**
 * Transform <style> in markdown to scoped style with page selector
 */
export function transformPageCSS(md: string, id: string) {
  const page = id.match(/(\d+)\.md$/)?.[1]
  if (!page)
    return md

  const result = md.replace(
    /(\n<style[^>]*?>)([\s\S]+?)(<\/style>)/g,
    (full, start, css, end) => {
      if (!start.includes('scoped'))
        start = start.replace('<style', '<style scoped')
      return `${start}\n.slidev-page-${page}{${css}}${end}`
    },
  )

  return result
}

/**
 * Transform Mermaid code blocks (render done on client side)
 */
export default function transformMermaid(md: string): string {
  return md
    .replace(/^```mermaid\s*?({.*?})?\n([\s\S]+?)\n```/mg, (full, options = '', code = '') => {
      code = code.trim()
      options = options.trim() || '{}'
      const encoded = base64.encode(code, true)
      return `<Mermaid :code="'${encoded}'" v-bind="${options}" />`
    })
}
