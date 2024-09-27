import markdownItPrism from '@slidev/cli/node/syntax/markdown-it/markdown-it-prism'
import Markdown from 'markdown-it'
import { describe, expect, it } from 'vitest'

describe('markdown-it-prism', () => {
  const md = Markdown()
  markdownItPrism(md, { plugins: [], init: () => {} })

  it('should render multi-line JS strings and comments correctly', () => {
    const text = `
\`\`\`js
\`Multi
line\`
/**
 * Hello
 */
\`\`\`
`
    const actual = md.render(text)
    expect(actual).toMatchSnapshot()
  })

  it('should render multi-line XML nodes correctly', () => {
    const text = `
\`\`\`xml
<a/>
<b
  attr="value"
/>
\`\`\`
`
    const actual = md.render(text)
    expect(actual).toMatchSnapshot()
  })

  it('should render non-multiline statements correctly', () => {
    const text = `
\`\`\`ts
const a = 1;
const b = 2;
const c = a + b;
\`\`\`
`
    const actual = md.render(text)
    expect(actual).toMatchSnapshot()
  })
})
