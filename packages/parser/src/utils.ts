import { clamp, isNumber, range, uniq } from '@antfu/utils'

export * from './timesplit'

const RE_ASPECT_RATIO_SEPARATOR = /[:/x|]/
const RE_CLICK_STEP = /^(\d+)(?:-(\d*))?$/

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
 * A click step of `exportClicks`: a single click, or an inclusive range. `Infinity` stands for the last click.
 */
export type ExportClickStep = number | [number, number]

function parseExportClicks(value: unknown): { steps: boolean | ExportClickStep[], invalid: string[] } {
  if (typeof value === 'boolean')
    return { steps: value, invalid: [] }
  const parts = (Array.isArray(value) ? value : [value])
    .flatMap(part => String(part).split(/[,;]/g))
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length === 1 && parts[0] === 'all')
    return { steps: true, invalid: [] }
  if (parts.length === 1 && parts[0] === 'none')
    return { steps: [], invalid: [] }

  const steps: ExportClickStep[] = []
  const invalid: string[] = []
  for (const part of parts) {
    if (part === 'last') {
      steps.push(Infinity)
      continue
    }
    const match = part.match(RE_CLICK_STEP)
    if (!match) {
      invalid.push(part)
      continue
    }
    const [, start, end] = match
    if (end === undefined)
      steps.push(+start)
    else
      steps.push([+start, end === '' ? Infinity : +end])
  }
  steps.sort((a, b) => (typeof a === 'number' ? a : a[0]) - (typeof b === 'number' ? b : b[0]))
  return { steps, invalid }
}

/**
 * Resolves the `exportClicks` frontmatter of a slide against the `withClicks` export option.
 * Invalid parts are dropped, see `validateExportClicks`.
 *
 * undefined => withClicks, true/false => itself, [] => [] (skip the slide),
 * [5, 0, 2] => [0, 2, 5], '1-3,5-,last' => [[1, 3], [5, Infinity], Infinity]
 */
export function resolveExportClicks(exportClicks: unknown, withClicks: boolean): boolean | ExportClickStep[] {
  if (exportClicks == null)
    return withClicks
  const { steps, invalid } = parseExportClicks(exportClicks)
  if (invalid.length && Array.isArray(steps) && !steps.length)
    return withClicks
  return steps
}

/**
 * The error message for an invalid `exportClicks` frontmatter, if any
 */
export function validateExportClicks(exportClicks: unknown): string | undefined {
  if (exportClicks == null)
    return
  const { invalid } = parseExportClicks(exportClicks)
  if (invalid.length)
    return `Invalid \`exportClicks\` value ${JSON.stringify(exportClicks)}: expected true, false, or click steps like "0,2-3,last"`
}

/**
 * The click steps to export, clamped to [clicksStart, total]
 *
 * false => [total], true => [clicksStart, ..., total], [0, [2, Infinity]] with total 4 => [0, 2, 3, 4]
 */
export function getExportClickSteps(exportClicks: boolean | ExportClickStep[], clicksStart: number, total: number): number[] {
  if (exportClicks === false)
    return [total]
  if (exportClicks === true)
    return range(clicksStart, total + 1)
  const steps = exportClicks.flatMap((step) => {
    if (typeof step === 'number')
      return [clamp(step, clicksStart, total)]
    return range(clamp(step[0], clicksStart, total), clamp(step[1], clicksStart, total) + 1)
  })
  return uniq(steps).sort((a, b) => a - b)
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
