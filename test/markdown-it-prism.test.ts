import { describe, expect, it } from 'vitest'
import Markdown from 'markdown-it'
import markdownItPrism from '../packages/slidev/node/plugins/markdown-it-prism'

describe('markdown-it-prism', () => {
  it('should render multi-line strings correctly', () => {
    const text = `
\`\`\`js
\`Multi
line\`
/**
 * Hello
 */
\`\`\`
`
    const md = Markdown()
    markdownItPrism(md, { plugins: [], init: () => {} })
    const actual = md.render(text)
    expect(actual).toMatchSnapshot()
  })
})
