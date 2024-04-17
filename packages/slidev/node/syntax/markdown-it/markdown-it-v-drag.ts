import type MarkdownIt from 'markdown-it'
import type MagicString from 'magic-string-stack'
import { SourceMapConsumer } from 'source-map-js'

export default function markdownItVDrag(md: MarkdownIt, markdownTransformMap: Map<string, MagicString>) {
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
