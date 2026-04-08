import * as shiki from 'shiki'
import { expect, it } from 'vitest'
import MarkdownItShiki from './shiki'

it('shiki integration', async () => {
  const options = {
    data: { config: {} },
    mode: 'dev',
    utils: {
      shiki,
      shikiOptions: { theme: 'nord' },
    },
  } as any

  const plugin = await MarkdownItShiki(options)

  expect(plugin).toBeDefined()
})
