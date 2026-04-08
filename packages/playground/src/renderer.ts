import MarkdownIt from 'markdown-it'

const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

// Add custom heading classes for Slidev-like styling
const defaultRender = md.renderer.rules.heading_open || ((tokens: any, idx: any, options: any, _env: any, self: any) => self.renderToken(tokens, idx, options))

md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const level = token.tag
  token.attrSet('class', `slidev-${level}`)
  return defaultRender(tokens, idx, options, env, self)
}

export function renderMarkdown(content: string): string {
  return md.render(content)
}
