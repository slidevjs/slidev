import MarkdownExit from 'markdown-exit'
import { expect, it } from 'vitest'
import MarkdownItSlotSugar from './slot-sugar'

it('slot markers', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSlotSugar)

  const result = await md.renderAsync('Default\n\n::right::\n\nRight content')

  expect(result).toMatchInlineSnapshot(`
    "<p>Default</p>

    <template v-slot:right="slotProps">
    <p>Right content</p>

    </template>
    "
  `)
})

it('not transform in code block', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItSlotSugar)

  const result = await md.renderAsync('```\n::right::\n```')

  expect(result).toMatchInlineSnapshot(`
    "<pre><code>::right::
    </code></pre>
    "
  `)
})
