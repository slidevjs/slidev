import MarkdownIt from 'markdown-it'
import { ref } from 'vue'
import { getMarkdownItShikiPlugin } from './shiki'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx]
  token.attrJoin('class', 'slidev-heading')
  return self.renderToken(tokens, idx, options)
}

export const shikiReady = ref(false)

getMarkdownItShikiPlugin().then((plugin) => {
  md.use(plugin)
  shikiReady.value = true
}).catch((err) => {
  console.error('Failed to load Shiki highlighter:', err)
})

export function renderMarkdown(content: string): string {
  return md.render(content)
}
