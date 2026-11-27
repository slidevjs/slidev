import MarkdownExit from 'markdown-exit'
import { expect, it } from 'vitest'
import MarkdownItLink from './link'

it('links', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItLink)

  expect(await md.renderAsync('[slide 1](#1)')).toMatchInlineSnapshot(`
    "<p><Link to="#1">slide 1</Link></p>
    "
  `)

  expect(await md.renderAsync('[external](https://example.com)')).toMatchInlineSnapshot(`
    "<p><a href="https://example.com" target="_blank">external</a></p>
    "
  `)
})
