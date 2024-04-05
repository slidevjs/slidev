import type MarkdownIt from 'markdown-it'
import type { SourceMapConsumer } from 'source-map-js'

export default function markdownItVDrag(md: MarkdownIt, sourceMapConsumers: Record<string, SourceMapConsumer>) {
  const visited = new WeakSet()

  const _parse = md.parse
  md.parse = function (src, env) {
    const smc = sourceMapConsumers[env.id]
    const toOriginalPos = smc
      ? (line: number) => smc.originalPositionFor({ line, column: 0 }).line
      : (line: number) => line
    function toMarkdownSource(map: [number, number], idx: number) {
      const [start, end] = map
      return `[${toOriginalPos(start)},${toOriginalPos(end)},${idx}]`
    }
    return _parse.call(this, src, env)
      .map((token) => {
        if (token.type !== 'html_block' || !token.content.includes('v-drag') || visited.has(token))
          return token

        // Iterates all html tokens and replaces <v-drag> with <v-drag :markdownSource="..."> to pass the markdown source to the component
        token.content = token.content
          .replace(
            /<v-drag([\s>])/g,
            (_, space, idx) => `<v-drag :markdownSource="${toMarkdownSource(token.map!, idx)}"${space}`,
          )
          .replace(
            /(?<![</\w])v-drag(=".*?")?/g,
            (_, value, idx) => `v-drag${value ?? ''} :markdownSource="[${token.map![0]},${token.map![1]},${idx}]"`,
          )
        visited.add(token)
        return token
      })
  }
}
