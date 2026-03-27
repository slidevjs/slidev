import path from 'node:path'
import MarkdownExit from 'markdown-exit'
import { expect, it } from 'vitest'
import MarkdownItSnippet from './snippet'

const options = {
  userRoot: path.join(__dirname, '../../../../test/fixtures/'),
  data: {
    watchFiles: {},
    slides: [{
      index: 0,
      source: { filepath: path.join(__dirname, '../../../../test/fixtures/test.md') },
    }],
  },
} as any

it('snippet import', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet.ts#snippet', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-ts">function _foo() {
      // ...
    }
    </code></pre>
    "
  `)
})

it('snippet in indented block', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('- item\n   <<< @/snippets/snippet.ts#snippet', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<ul>
    <li>item<pre><code class="language-ts">function _foo() {
      // ...
    }
    </code></pre>
    </li>
    </ul>
    "
  `)
})

it('not transform in code block', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('```\n<<< @/snippets/snippet.ts\n```', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code>&lt;&lt;&lt; @/snippets/snippet.ts
    </code></pre>
    "
  `)
})
