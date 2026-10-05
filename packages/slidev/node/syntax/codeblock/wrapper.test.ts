import MarkdownExit from 'markdown-exit'
import * as shiki from 'shiki'
import { expect, it } from 'vitest'
import { MarkdownItCodeblocks } from '.'
import MarkdownItShiki from '../shiki'

it('keeps languages containing `#` or `+`', async () => {
  const md = MarkdownExit({ html: true })
  const options = {
    data: { config: {} },
    mode: 'dev',
    utils: {
      shiki,
      shikiOptions: { theme: 'nord' },
    },
  } as any

  md.use(await MarkdownItShiki(options))
  md.use(MarkdownItCodeblocks, options, [])

  const result = await md.renderAsync([
    '```c# [Program.cs] {1}',
    'using System;',
    '```',
  ].join('\n'))

  expect(result).toContain('title="Program.cs"')
  expect(result).toContain(':ranges=\'["1"]\'')
  expect(result).toContain('<code class="language-c#">')
  expect(result).toContain('<span style="color:#81A1C1">using</span>')
})
