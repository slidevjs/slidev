import MarkdownExit from 'markdown-exit'
import { expect, it } from 'vitest'
import MarkdownItEscapeInlineCode from './escape-code'

it('escape inline code', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItEscapeInlineCode)

  const result = await md.renderAsync('This is `inline {{code}}` test')

  expect(result).toMatchInlineSnapshot(`
    "<p>This is <code v-pre>inline {{code}}</code> test</p>
    "
  `)
})
