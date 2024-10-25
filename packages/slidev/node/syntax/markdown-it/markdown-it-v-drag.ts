import type MagicString from 'magic-string-stack'
import type MarkdownIt from 'markdown-it'
import type { Token } from 'markdown-it'
import { SourceMapConsumer } from 'source-map-js'

const dragComponentRegex = /<(v-?drag-?\w*)([\s>])/i
const dragDirectiveRegex = /(?<![</\w])v-drag(=".*?")?/i

export default function MarkdownItVDrag(md: MarkdownIt, markdownTransformMap: Map<string, MagicString>) {
  const visited = new WeakSet()
  const sourceMapConsumers = new WeakMap<MagicString, SourceMapConsumer>()

  function getSourceMapConsumer(id: string) {
    const s = markdownTransformMap.get(id)
    if (!s)
      return undefined
    let smc = sourceMapConsumers.get(s)
    if (smc)
      return smc
    const sourceMap = s.generateMap()
    smc = new SourceMapConsumer({
      ...sourceMap,
      version: sourceMap.version.toString(),
    })
    sourceMapConsumers.set(s, smc)
    return smc
  }

  const _parse = md.parse
  md.parse = function (src, env) {
    const smc = getSourceMapConsumer(env.id)
    const toOriginalPos = smc
      ? (line: number) => smc.originalPositionFor({ line: line + 1, column: 0 }).line - 1
      : (line: number) => line
    function toMarkdownSource(map: [number, number], idx: number) {
      const start = toOriginalPos(map[0])
      const end = toOriginalPos(map[1])
      return `[${start},${Math.max(start + 1, end)},${idx}]`
    }

    function replaceChildren(token: Token, regex: RegExp, replacement: string) {
      for (const child of token.children ?? []) {
        if (child.type === 'html_block' || child.type === 'html_inline') {
          child.content = child.content.replace(regex, replacement)
        }
        replaceChildren(child, regex, replacement)
      }
    }

    return _parse.call(this, src, env)
      .map((token) => {
        if (!['html_block', 'html_inline', 'inline'].includes(token.type) || !token.content.includes('drag') || visited.has(token))
          return token

        // Iterates all html tokens and replaces <v-drag> with <v-drag :markdownSource="..."> to pass the markdown source to the component
        token.content = token.content
          .replace(dragComponentRegex, (_, tag, space, idx) => {
            const replacement = `<${tag} :markdownSource="${toMarkdownSource(token.map!, idx)}"${space}`
            replaceChildren(token, dragComponentRegex, replacement)
            return replacement
          })
          .replace(dragDirectiveRegex, (_, value, idx) => {
            const replacement = `v-drag${value ?? ''} :markdownSource="${toMarkdownSource(token.map!, idx)}"`
            replaceChildren(token, dragDirectiveRegex, replacement)
            return replacement
          })

        visited.add(token)
        return token
      })
  }
}
