import { resolve } from 'node:path'
import Markdown from 'unplugin-vue-markdown/vite'
import type { Plugin } from 'vite'
import * as base64 from 'js-base64'
import { slash } from '@antfu/utils'

// @ts-expect-error missing types
import mila from 'markdown-it-link-attributes'

// @ts-expect-error missing types
import mif from 'markdown-it-footnote'
import { taskLists } from '@hedgedoc/markdown-it-plugins'
import type { KatexOptions } from 'katex'
import type MarkdownIt from 'markdown-it'
import type { ShikiOptions } from '@slidev/types'
import { encode } from 'plantuml-encoder'
import Mdc from 'markdown-it-mdc'
import { addClassToHast } from 'shikiji'
import fs from 'fs-extra'
import type { MarkdownItShikijiOptions } from 'markdown-it-shikiji'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '../options'
import Katex from './markdown-it-katex'
import { loadSetups } from './setupNode'
import Prism from './markdown-it-prism'
import MarkdownItShiki, { resolveShikiOptions } from './markdown-it-shiki'
import { transformSnippet } from './transformSnippet'

const DEFAULT_SHIKI_OPTIONS: ShikiOptions = {
  theme: {
    dark: 'min-dark',
    light: 'min-light',
  },
}

export async function createMarkdownPlugin(
  options: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
): Promise<Plugin> {
  const { data: { config }, roots, mode, entry } = options

  const setups: ((md: MarkdownIt) => void)[] = []
  const entryPath = slash(entry)

  if (config.highlighter === 'shiki') {
    const Shiki = await import('shiki')
    const shikiOptions: ShikiOptions = await loadSetups(roots, 'shiki.ts', Shiki, DEFAULT_SHIKI_OPTIONS, false)
    const { langs, themes } = resolveShikiOptions(shikiOptions)
    shikiOptions.highlighter = await Shiki.getHighlighter({ themes, langs })
    setups.push(md => md.use(MarkdownItShiki, shikiOptions))
  }
  else if (config.highlighter === 'shikiji') {
    const MarkdownItShikiji = await import('markdown-it-shikiji').then(r => r.default)
    const { transformerTwoSlash, rendererRich } = await import('shikiji-twoslash')
    const options = await loadShikijiSetups(roots)
    const plugin = await MarkdownItShikiji({
      ...options,
      transformers: [
        ...options.transformers || [],
        transformerTwoSlash({
          explicitTrigger: true,
          renderer: rendererRich(),
          twoslashOptions: {
            defaultOptions: {
              noErrorValidation: true,
            },
          },
        }),
        {
          pre(pre) {
            addClassToHast(pre, 'slidev-code shikiji')
          },
          postprocess(code) {
            return escapeVueInCode(code)
          },
        },
      ],
    })
    setups.push(md => md.use(plugin))
  }
  else {
    setups.push(md => md.use(Prism))
  }

  if (config.mdc)
    setups.push(md => md.use(Mdc))

  const KatexOptions: KatexOptions = await loadSetups(roots, 'katex.ts', {}, { strict: false }, false)

  return Markdown({
    include: [/\.md$/],
    wrapperClasses: '',
    headEnabled: false,
    frontmatter: false,
    markdownItOptions: {
      quotes: '""\'\'',
      html: true,
      xhtmlOut: true,
      linkify: true,
      ...mdOptions?.markdownItOptions,
    },
    ...mdOptions,
    markdownItSetup(md) {
      md.use(mila, {
        attrs: {
          target: '_blank',
          rel: 'noopener',
        },
      })

      md.use(mif)
      md.use(taskLists, { enabled: true, lineNumber: true, label: true })
      md.use(Katex, KatexOptions)

      setups.forEach(i => i(md))

      mdOptions?.markdownItSetup?.(md)
    },
    transforms: {
      before(code, id) {
        if (id === entryPath)
          return ''

        const monaco = (config.monaco === true || config.monaco === mode)
          ? transformMarkdownMonaco
          : truncateMancoMark

        code = transformSlotSugar(code)
        code = transformSnippet(code, options, id)
        code = transformMermaid(code)
        code = transformPlantUml(code, config.plantUmlServer)
        code = monaco(code)
        code = transformHighlighter(code)
        code = transformPageCSS(code, id)
        code = transformKaTex(code)

        return code
      },
    },
  }) as Plugin
}

export function transformKaTex(md: string) {
  return md.replace(/^\$\$(?:\s*{([\d\w*,\|-]+)}\s*?({.*?})?\s*?)?\n([\s\S]+?)^\$\$/mg, (full, rangeStr = '', _, code: string) => {
    const ranges = (rangeStr as string).split(/\|/g).map(i => i.trim())
    code = code.trimEnd()
    return `<KaTexBlockWrapper :ranges='${JSON.stringify(ranges)}'>\n\n\$\$\n${code}\n\$\$\n</KaTexBlockWrapper>\n`
  })
}

export function transformMarkdownMonaco(md: string) {
  // transform monaco
  md = md.replace(/^```(\w+?)\s*{monaco-diff}\s*?({.*?})?\s*?\n([\s\S]+?)^~~~\s*?\n([\s\S]+?)^```/mg, (full, lang = 'ts', options = '{}', code: string, diff: string) => {
    lang = lang.trim()
    options = options.trim() || '{}'
    const encoded = base64.encode(code, true)
    const encodedDiff = base64.encode(diff, true)
    return `<Monaco :code="'${encoded}'" :diff="'${encodedDiff}'" lang="${lang}" v-bind="${options}" />`
  })
  md = md.replace(/^```(\w+?)\s*{monaco}\s*?({.*?})?\s*?\n([\s\S]+?)^```/mg, (full, lang = 'ts', options = '{}', code: string) => {
    lang = lang.trim()
    options = options.trim() || '{}'
    const encoded = base64.encode(code, true)
    return `<Monaco :code="'${encoded}'" lang="${lang}" v-bind="${options}" />`
  })

  return md
}

export function truncateMancoMark(md: string) {
  return md.replace(/{monaco.*?}/g, '')
}

export function transformSlotSugar(md: string) {
  const lines = md.split(/\r?\n/g)

  let prevSlot = false

  const { isLineInsideCodeblocks } = getCodeBlocks(md)

  lines.forEach((line, idx) => {
    if (isLineInsideCodeblocks(idx))
      return

    const match = line.trimEnd().match(/^::\s*([\w\.\-\:]+)\s*::$/)
    if (match) {
      lines[idx] = `${prevSlot ? '\n\n</template>\n' : '\n'}<template v-slot:${match[1]}="slotProps">\n`
      prevSlot = true
    }
  })

  if (prevSlot)
    lines[lines.length - 1] += '\n\n</template>'

  return lines.join('\n')
}

/**
 * Transform code block with wrapper
 */
export function transformHighlighter(md: string) {
  return md.replace(/^```(\w+?)(?:\s*{([\d\w*,\|-]+)}\s*?({.*?})?(.*?))?\n([\s\S]+?)^```/mg, (full, lang = '', rangeStr = '', options = '', attrs = '', code: string) => {
    const ranges = (rangeStr as string).split(/\|/g).map(i => i.trim())
    code = code.trimEnd()
    options = options.trim() || '{}'
    return `\n<CodeBlockWrapper v-bind="${options}" :ranges='${JSON.stringify(ranges)}'>\n\n\`\`\`${lang}${attrs}\n${code}\n\`\`\`\n\n</CodeBlockWrapper>`
  })
}

export function getCodeBlocks(md: string) {
  const codeblocks = Array
    .from(md.matchAll(/^```[\s\S]*?^```/mg))
    .map((m) => {
      const start = m.index!
      const end = m.index! + m[0].length
      const startLine = md.slice(0, start).match(/\n/g)?.length || 0
      const endLine = md.slice(0, end).match(/\n/g)?.length || 0
      return [start, end, startLine, endLine]
    })

  return {
    codeblocks,
    isInsideCodeblocks(idx: number) {
      return codeblocks.some(([s, e]) => s <= idx && idx <= e)
    },
    isLineInsideCodeblocks(line: number) {
      return codeblocks.some(([, , s, e]) => s <= line && line <= e)
    },
  }
}

/**
 * Transform <style> in markdown to scoped style with page selector
 */
export function transformPageCSS(md: string, id: string) {
  const page = id.match(/(\d+)\.md$/)?.[1]
  if (!page)
    return md

  const { isInsideCodeblocks } = getCodeBlocks(md)

  const result = md.replace(
    /(\n<style[^>]*?>)([\s\S]+?)(<\/style>)/g,
    (full, start, css, end, index) => {
      // don't replace `<style>` inside code blocks, #101
      if (index < 0 || isInsideCodeblocks(index))
        return full
      if (!start.includes('scoped'))
        start = start.replace('<style', '<style scoped')
      return `${start}\n${css}${end}`
    },
  )

  return result
}

/**
 * Transform Mermaid code blocks (render done on client side)
 */
export function transformMermaid(md: string): string {
  return md
    .replace(/^```mermaid\s*?({.*?})?\n([\s\S]+?)\n```/mg, (full, options = '', code = '') => {
      code = code.trim()
      options = options.trim() || '{}'
      const encoded = base64.encode(code, true)
      return `<Mermaid :code="'${encoded}'" v-bind="${options}" />`
    })
}

export function transformPlantUml(md: string, server: string): string {
  return md
    .replace(/^```plantuml\s*?({.*?})?\n([\s\S]+?)\n```/mg, (full, options = '', content = '') => {
      const code = encode(content.trim())
      options = options.trim() || '{}'
      return `<PlantUml :code="'${code}'" :server="'${server}'" v-bind="${options}" />`
    })
}

/**
 * Escape `{{}}` in code block to prevent Vue interpret it, #99
 */
export function escapeVueInCode(md: string) {
  return md.replace(/{{(.*?)}}/g, '&lbrace;&lbrace;$1&rbrace;&rbrace;')
}

export async function loadShikijiSetups(
  roots: string[],
) {
  const anyShikiji = roots.some(root => fs.existsSync(resolve(root, 'setup', 'shikiji.ts')))
  const result: any = anyShikiji
    ? await loadSetups(roots, 'shikiji.ts', undefined, {}, false)
    : await loadSetups(roots, 'shiki.ts', await import('shiki'), {}, false)

  if ('theme' in result && 'themes' in result)
    delete result.theme

  if (result.theme && typeof result.theme !== 'string') {
    result.themes = result.theme
    delete result.theme
  }

  // No theme at all, apply the default
  if (!result.theme && !result.themes) {
    result.themes = {
      dark: 'vitesse-dark',
      light: 'vitesse-light',
    }
  }

  if (result.themes)
    result.defaultColor = false

  return result as MarkdownItShikijiOptions
}
