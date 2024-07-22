import type MarkdownIt from 'markdown-it'

export default function MarkdownItEscapeInlineCode(md: MarkdownIt) {
  const codeInline = md.renderer.rules.code_inline!
  md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
    const result = codeInline(tokens, idx, options, env, self)
    return result.replace(/^<code/, '<code v-pre')
  }
}
