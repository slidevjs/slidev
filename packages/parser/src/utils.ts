import { isNumber, range, uniq } from '@antfu/utils'

export * from './timesplit'

const RE_ASPECT_RATIO_SEPARATOR = /[:/x|]/
const RE_RANGE_FRAGMENT = /^(\d+)(?:\s*-\s*(\d*))?$/

function parsePositiveSafeInteger(value: string) {
  const integer = Number(value)
  return Number.isSafeInteger(integer) && integer >= 1 ? integer : undefined
}

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
    const match = RE_RANGE_FRAGMENT.exec(part.trim())
    if (!match)
      continue

    const start = parsePositiveSafeInteger(match[1])
    const end = match[2] === undefined
      ? start
      : match[2] === ''
        ? total
        : parsePositiveSafeInteger(match[2])

    if (start === undefined || end === undefined || start > end)
      continue

    const clampedEnd = Math.min(total, end)
    if (start <= clampedEnd)
      indexes.push(...range(start, clampedEnd + 1))
  }

  return uniq(indexes).sort((a, b) => a - b)
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
