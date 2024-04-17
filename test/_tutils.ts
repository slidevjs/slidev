import MagicString from 'magic-string-stack'
import type { MarkdownTransformContext } from '@slidev/types'

export function createTransformContext(code: string): MarkdownTransformContext {
  const s = new MagicString(code)
  return {
    s,
    ignores: [],
    isIgnored(index: number) {
      return this.ignores.some(([start, end]) => index >= start && index < end)
    },
  }
}
