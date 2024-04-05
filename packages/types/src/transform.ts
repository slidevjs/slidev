import type MagicString from 'magic-string'

export interface MarkdownTransformContext {
  s: MagicString
  ignores: [number, number][]
  isIgnored: (index: number) => boolean
}
