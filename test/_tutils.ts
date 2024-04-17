import path from 'node:path'
import MagicString from 'magic-string-stack'
import type { MarkdownTransformContext } from '@slidev/types'

export function createTransformContext(code: string): MarkdownTransformContext {
  const s = new MagicString(code)
  return {
    s,
    id: '1.md',
    ignores: [],
    isIgnored(index: number) {
      return this.ignores.some(([start, end]) => index >= start && index < end)
    },
    options: {
      userRoot: path.join(__dirname, './fixtures/'),
      data: {
        slides: [
          {} as any,
        ],
        watchFiles: [],
        config: {} as any,
      },
    } as any,
  }
}
