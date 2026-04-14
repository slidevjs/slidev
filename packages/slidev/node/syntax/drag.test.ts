import type MagicString from 'magic-string-stack'
import MarkdownExit from 'markdown-exit'
import { expect, it } from 'vitest'
import MarkdownItVDrag from './drag'

it('v-drag component', async () => {
  const md = MarkdownExit({ html: true })
  const map = new Map<string, MagicString>()
  md.use(MarkdownItVDrag, map)

  const result = await md.renderAsync('<v-drag>Content</v-drag>', { id: 'test' })

  expect(result).toMatchInlineSnapshot(`
    "<p><v-drag :markdownSource="[0,1,0]">Content</v-drag></p>
    "
  `)
})

it('v-drag directive', async () => {
  const md = MarkdownExit({ html: true })
  const map = new Map<string, MagicString>()
  md.use(MarkdownItVDrag, map)

  const result = await md.renderAsync('<div v-drag>Content</div>', { id: 'test' })

  expect(result).toMatchInlineSnapshot(`"<div v-drag :markdownSource="[0,1,5]">Content</div>"`)
})
