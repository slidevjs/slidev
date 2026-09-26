import MarkdownExit from 'markdown-exit'
import path from 'pathe'
import { expect, it, onTestFinished, vi } from 'vitest'
import { monacoWriterWhitelist } from '../vite/monacoWrite'
import MarkdownItSnippet, { resolveSnippetImport } from './snippet'

const fixturesRoot = path.join(__dirname, '../../../../test/fixtures/')

const options = {
  userRoot: fixturesRoot,
  userWorkspaceRoot: fixturesRoot,
  roots: [fixturesRoot],
  data: {
    watchFiles: {},
    slides: [{
      index: 0,
      source: { filepath: path.join(fixturesRoot, 'test.md') },
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

it('resolves a snippet path that stays inside the allowed roots', () => {
  const slide = { source: { filepath: path.join(fixturesRoot, 'test.md') } } as any
  const result = resolveSnippetImport('<<< @/snippets/snippet.ts#snippet', fixturesRoot, slide, [fixturesRoot])
  expect(result?.src).toBe(path.join(fixturesRoot, 'snippets/snippet.ts').replaceAll('\\', '/'))
})

it('throws when a snippet path escapes the allowed roots', () => {
  const slide = { source: { filepath: path.join(fixturesRoot, 'test.md') } } as any
  expect(() => resolveSnippetImport('<<< ../../../../../outside.ts', fixturesRoot, slide, [fixturesRoot]))
    .toThrow(/escapes the project root/)
})

it('whitelists a {monaco-write} snippet under the path the writer resolves', async () => {
  monacoWriterWhitelist.clear()
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet.ts {monaco-write}', { id: 'slides.md__slidev_1.md' })

  // createMonacoWriterPlugin does path.resolve(userRoot, file), so the value it
  // is handed has to resolve back to the file that was read.
  expect([...monacoWriterWhitelist]).toEqual(['snippets/snippet.ts'])
  expect(result).toContain('writable="snippets/snippet.ts"')
  // pathe normalises separators, so this is the writer's path.resolve verbatim.
  expect(path.resolve(fixturesRoot, [...monacoWriterWhitelist][0]))
    .toBe(path.join(fixturesRoot, 'snippets/snippet.ts'))
})

it('renders unique tag and removes other tags', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet-with-tags.ts#tag=foo', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-ts">function _fooWithTags() {
      // eslint-disable-next-line no-console
      console.log('hello')
      // ...
    }
    </code></pre>
    "
  `)
})

it('renders tag and removes excluded tags', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet-with-tags.ts#tags=foo;!bar', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-ts">function _fooWithTags() {
      // ...
    }
    </code></pre>
    "
  `)
})

it('renders everything without tags when using ** wildcard', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet-with-tags.ts#tags=**', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-ts">// line 1
    
    function _fooWithTags() {
      // eslint-disable-next-line no-console
      console.log('hello')
      // ...
    }
    
    // line 9
    </code></pre>
    "
  `)
})

it('renders only the tagged sections when using * wildcard', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet-with-tags.ts#tags=*', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-ts">function _fooWithTags() {
      // eslint-disable-next-line no-console
      console.log('hello')
      // ...
    }
    </code></pre>
    "
  `)
})

it('supports html comments and renders all the requested tagged sections', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet-with-tags.html#tags=paragraph;div', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-html">&lt;p&gt;This is a paragraph&lt;/p&gt;
    &lt;div&gt;This is a div&lt;/div&gt;
    &lt;div&gt;This is also a div&lt;/div&gt;
    </code></pre>
    "
  `)
})

it('logs a warning when tag not found', async () => {
  const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  onTestFinished(() => {
    mockWarn.mockRestore()
  })

  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet-with-tags.ts#tags=bar;absent', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-ts">// eslint-disable-next-line no-console
    console.log('hello')
    </code></pre>
    "
  `)

  expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(`tag 'absent' not found in file`))
})

it('logs a warning when tag not ended', async () => {
  const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  onTestFinished(() => {
    mockWarn.mockRestore()
  })

  const md = MarkdownExit()
  md.use(MarkdownItSnippet, options)

  const result = await md.renderAsync('<<< @/snippets/snippet-with-tag-not-ended.ts#tag=bar', { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<pre><code class="language-ts">  // eslint-disable-next-line no-console
      console.log('hello')
      // ...
    }
    </code></pre>
    "
  `)

  expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(`detected unclosed tag 'bar'`))
})
