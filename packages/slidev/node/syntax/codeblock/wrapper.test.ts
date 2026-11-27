import MarkdownExit from 'markdown-exit'
import * as shiki from 'shiki'
import { beforeAll, describe, expect, it } from 'vitest'
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

describe('twoslash', { timeout: 20_000 }, () => {
  const md = MarkdownExit({ html: true })

  beforeAll(async () => {
    const options = {
      data: {
        config: { twoslash: true },
      },
      mode: 'dev',
      utils: {
        shiki,
        shikiOptions: { theme: 'nord' },
      },
    } as any

    md.use(await MarkdownItShiki(options))
    md.use(MarkdownItCodeblocks, options, [])
  })

  it.each([
    ['ts twoslash', '', '[]'],
    ['ts {} twoslash', '', '[]'],
    ['ts {2} twoslash', '', '["2"]'],
    ['ts twoslash {2}', '', '["2"]'],
    ['ts twoslash [main.ts]', 'main.ts', '[]'],
    ['ts twoslash [main.ts] {2}', 'main.ts', '["2"]'],
  ])('keeps twoslash, title and ranges for `%s`', async (info, title, ranges) => {
    const result = await md.renderAsync([
      `\`\`\`${info}`,
      'const a = 1',
      'const b = a + 1',
      '//    ^?',
      '```',
    ].join('\n'))

    expect(result).toContain(`title=${JSON.stringify(title)}`)
    expect(result).toContain(`:ranges='${ranges}'`)
    expect(result).toContain('twoslash-hover')
    expect(result).not.toContain('^?')
  })
})
