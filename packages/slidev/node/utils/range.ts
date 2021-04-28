import { range, uniq } from '@antfu/utils'

export function getPagesByRange(total: number, rangeStr?: string) {
  if (!rangeStr || rangeStr === 'all')
    return range(total)

  const pages: number[] = []
  for (const part of rangeStr.split(/[,;]/g)) {
    if (!part.includes('-')) {
      pages.push(+part - 1)
    }
    else {
      const [start, end] = part.split('-', 2)
      pages.push(
        ...range(+start - 1, end === '' ? total : +end),
      )
    }
  }

  return uniq(pages).sort().filter(i => i < total)
}
