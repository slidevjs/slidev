import MarkdownExit from 'markdown-exit'
import { expect, it } from 'vitest'
import MarkdownItStyleScoped from './scoped'

it('add scoped to style', async () => {
  const md = MarkdownExit({ html: true })
  md.use(MarkdownItStyleScoped)

  const result = await md.renderAsync('<style>\n.red { color: red; }\n</style>')

  expect(result).toMatchInlineSnapshot(`
    "<style scoped>
    .red { color: red; }
    </style>"
  `)
})

it('preserve existing scoped', async () => {
  const md = MarkdownExit({ html: true })
  md.use(MarkdownItStyleScoped)

  const result = await md.renderAsync('<style scoped>\n.red { color: red; }\n</style>')

  expect(result).toMatchInlineSnapshot(`
    "<style scoped>
    .red { color: red; }
    </style>"
  `)
})

it('not transform in code block', async () => {
  const md = MarkdownExit({ html: true })
  md.use(MarkdownItStyleScoped)

  const result = await md.renderAsync('```html\n<style>\n.red { color: red; }\n</style>\n```')

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-html">&lt;style&gt;
    .red { color: red; }
    &lt;/style&gt;
    </code></pre>
    "
  `)
})
