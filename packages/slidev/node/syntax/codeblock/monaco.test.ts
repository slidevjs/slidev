import MarkdownExit from 'markdown-exit'
import * as shiki from 'shiki'
import { expect, it } from 'vitest'
import { MarkdownItCodeblocks } from '.'

function createMarkdown() {
  const md = MarkdownExit({ html: true })
  md.use(MarkdownItCodeblocks, {
    data: {
      config: { monaco: true },
    },
    mode: 'dev',
    utils: {
      shiki,
      shikiOptions: { theme: 'nord' },
    },
  } as any, [])

  return md
}

it('supports nested objects in Monaco options', async () => {
  const md = createMarkdown()

  const result = await md.renderAsync([
    '```ts {monaco} { editorOptions: { wordWrap:\'on\'} }',
    'console.log(\'HelloWorld\')',
    '```',
  ].join('\n'))

  expect(result).toContain('<Monaco v-bind="{ editorOptions: { wordWrap:\'on\'} }"')
})

it('ignores trailing meta after Monaco options', async () => {
  const md = createMarkdown()

  const result = await md.renderAsync([
    '```ts {monaco-run} { autorun: false } twoslash',
    'console.log(\'HelloWorld\')',
    '```',
  ].join('\n'))

  expect(result).toContain('<Monaco v-bind="{ autorun: false }" runnable')
})
