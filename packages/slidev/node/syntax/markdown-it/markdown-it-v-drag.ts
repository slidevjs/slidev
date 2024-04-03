import type MarkdownIt from 'markdown-it'

export default function markdownItVDrag(md: MarkdownIt) {
  const visited = new WeakSet()

  const _parse = md.parse
  md.parse = function (src, env) {
    return _parse.call(this, src, env)
      .map((token) => {
        if (token.type !== 'html_block' || !token.content.includes('v-drag') || visited.has(token))
          return token

        // Iterates all html tokens and replaces <v-drag> with <v-drag :markdownSource="..."> to pass the markdown source to the component
        token.content = token.content
          .replace(
            /<v-drag([\s>])/g,
            (_, space, idx) => `<v-drag :markdownSource="[${token.map![0]},${token.map![1]},${idx}]"${space}`,
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
