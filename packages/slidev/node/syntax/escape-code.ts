import type MarkdownExit from 'markdown-exit'

const RE_CODE_TAG_OPEN = /^<code/

export default function MarkdownItEscapeInlineCode(md: MarkdownExit) {
  const codeInline = md.renderer.rules.code_inline!
  md.renderer.rules.code_inline = async (tokens, idx, options, env, self) => {
    const result = await codeInline(tokens, idx, options, env, self)
    return result.replace(RE_CODE_TAG_OPEN, '<code v-pre')
  }
}
