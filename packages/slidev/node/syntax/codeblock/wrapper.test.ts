import MarkdownExit from 'markdown-exit'
import * as shiki from 'shiki'
import { describe, expect, it } from 'vitest'
import { MarkdownItCodeblocks } from '.'
import MarkdownItShiki from '../shiki'

describe('markdownItCodeblocks', () => {
  const createMd = async (config = {}) => {
    const md = MarkdownExit({ html: true })
    const options = {
      data: { config },
      mode: 'dev',
      utils: {
        shiki,
        shikiOptions: { theme: 'nord' },
      },
    } as any

    md.use(await MarkdownItShiki(options))
    md.use(MarkdownItCodeblocks, options, [])
    return md
  }

  it('keeps languages containing `#` or `+`', async () => {
    const md = await createMd()

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

  it('renders code block with nested options', async () => {
    const md = await createMd()

    const result = await md.renderAsync([
      '```txt {editorOptions:{lineNumbers:\'off\'}}',
      'git reset',
      '```',
    ].join('\n'))

    expect(result).toContain('v-bind="{editorOptions:{lineNumbers:\'off\'}}"')
    expect(result).toContain('<code class="language-txt">')
  })

  it('renders monaco with nested options', async () => {
    const md = await createMd({ monaco: true })

    const result = await md.renderAsync([
      '```ts {monaco-run}{runnerOptions: {container: \'out\'}}',
      'console.log("hello")',
      '```',
    ].join('\n'))

    expect(result).toContain('<Monaco v-bind="{runnerOptions: {container: \'out\'}}" runnable lang="ts"')
  })
})
