import type MarkdownExit from 'markdown-exit'

export default function MarkdownItEscapeInlineCode(md: MarkdownExit) {
  const codeInline = md.renderer.rules.code_inline!
  md.renderer.rules.code_inline = async (tokens, idx, options, env, self) => {
    const result = await codeInline(tokens, idx, options, env, self)
    return result.replace(/^<code/, '<code v-pre')
  }
}
