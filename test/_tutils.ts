import path from 'node:path'
import MagicString from 'magic-string-stack'
import type { MarkdownTransformContext } from '@slidev/types'

export function createTransformContext(code: string, shiki?: any): MarkdownTransformContext {
  const s = new MagicString(code)
  return {
    s,
    id: '1.md',
    options: {
      userRoot: path.join(__dirname, './fixtures/'),
      data: {
        slides: [
          {} as any,
        ],
        watchFiles: [],
        config: {} as any,
        features: {},
      },
      utils: {
        shiki,
        shikiOptions: {
          theme: 'nord',
        },
      },
    } as any,
  }
}
