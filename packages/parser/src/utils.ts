import { isAbsolute, relative } from 'node:path'
import { isNumber, range, uniq } from '@antfu/utils'

export * from './timesplit'

/**
 * Whether `filePath` resolves inside any of `roots` (no `..` escape).
 * Inlined here (rather than imported from the `slidev` package) because
 * `@slidev/parser` must stay independent of `@slidev/slidev`.
 */
export function isPathInsideRoots(filePath: string, roots: string[]): boolean {
  return roots.some((root) => {
    const rel = relative(root, filePath)
    return rel === '' || (!!rel && !rel.startsWith('..') && !isAbsolute(rel))
  })
}

const RE_ASPECT_RATIO_SEPARATOR = /[:/x|]/

/**
 * 1,3-5,8 => [1, 3, 4, 5, 8]
 */
export function parseRangeString(total: number, rangeStr?: string) {
  if (!rangeStr || rangeStr === 'all' || rangeStr === '*')
    return range(1, total + 1)

  if (rangeStr === 'none')
    return []

  const indexes: number[] = []
  for (const part of rangeStr.split(/[,;]/g)) {
    if (!part.includes('-')) {
      indexes.push(+part)
    }
    else {
      const [start, end] = part.split('-', 2)
      indexes.push(
        ...range(+start, !end ? (total + 1) : (+end + 1)),
      )
    }
  }

  return uniq(indexes).filter(i => i <= total).sort((a, b) => a - b)
}

/**
 * Accepts `16/9` `1:1` `3x4`
 */
export function parseAspectRatio(str: string | number) {
  if (isNumber(str))
    return str
  if (!Number.isNaN(+str))
    return +str
  const [wStr = '', hStr = ''] = str.split(RE_ASPECT_RATIO_SEPARATOR)
  const w = Number.parseFloat(wStr.trim())
  const h = Number.parseFloat(hStr.trim())

  if (Number.isNaN(w) || Number.isNaN(h) || h === 0)
    throw new Error(`Invalid aspect ratio "${str}"`)

  return w / h
}
