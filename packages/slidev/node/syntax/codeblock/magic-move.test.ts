import lz from 'lz-string'
import MarkdownExit from 'markdown-exit'
import path from 'pathe'
import * as shiki from 'shiki'
import { expect, it } from 'vitest'
import { MarkdownItCodeblocks } from '.'

it('resolves snippet imports before magic move validation', async () => {
  const md = MarkdownExit({ html: true })
  const userRoot = path.join(__dirname, '../../../../../test/fixtures/')
  const watchFiles: Record<string, Set<number>> = {}

  md.use(MarkdownItCodeblocks, {
    userRoot,
    data: {
      watchFiles,
      slides: [{
        index: 0,
        source: { filepath: path.join(userRoot, 'test.md') },
      }],
      config: { lineNumbers: false },
    },
    utils: {
      shiki,
      shikiOptions: { theme: 'nord' },
    },
  } as any, [])

  const result = await md.renderAsync([
    '````md magic-move',
    '<<< @/snippets/snippet.ts#snippet ts',
    '<<< @/snippets/snippet.ts ts {1}',
    '````',
  ].join('\n'), { id: 'slides.md__slidev_1.md' })

  expect(result).toContain('<ShikiMagicMove ')
  expect(result).toContain(':step-ranges=\'[[],["1"]]\'')

  const encodedSteps = result.match(/steps-lz=([^ ]+)/)?.[1]?.slice(1, -1)
  expect(encodedSteps).toBeTruthy()

  const steps = JSON.parse(lz.decompressFromBase64(encodedSteps!)!) as Array<{ lang: string }>
  expect(steps).toHaveLength(2)
  expect(steps.map(step => step.lang)).toEqual(['ts', 'ts'])

  const watched = Object.values(watchFiles)
  expect(watched).toHaveLength(1)
  expect(watched[0]).toEqual(new Set([0]))
})
