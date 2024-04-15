import type { ComputedRef } from 'vue'

export type RawAtValue = undefined | boolean | string | number | [string | number, string | number]

export type NormalizedSinceClickValue =
  | number // since absolute click
  | string // since relative click

export type NormalizedRangeClickValue =
  | [number, number] // [absolute start, absolute end]
  | [number, string] // [absolute start, absolute end based on start]
  | [string, number] // [relative start, absolute end]
  | [string, string] // [relative start, relative end]

export type NormalizedAtValue =
  | NormalizedSinceClickValue // since
  | NormalizedRangeClickValue // range
  | null // disabled

export type ClicksElement = Element | string

export interface ClicksInfo {
  /**
   * The absolute start click num
   */
  start: number
  /**
   * The absolute end click num
   */
  end: number
  /**
   * The required total click num
   */
  max: number
  /**
   * The delta for relative clicks
   */
  delta: number
  /**
   * Computed ref of whether the click is exactly matched
   */
  isCurrent: ComputedRef<boolean>
  /**
   * Computed ref of whether the click is active
   */
  isActive: ComputedRef<boolean>
}

export interface ClicksContext {
  current: number
  readonly clicksStart: number
  readonly relativeOffsets: Map<ClicksElement, number>
  readonly maxMap: Map<ClicksElement, number>
  calculateSince: (at: NormalizedSinceClickValue, size?: number) => ClicksInfo
  calculateRange: (at: NormalizedRangeClickValue) => ClicksInfo
  calculate: (at: NormalizedAtValue) => ClicksInfo | null
  register: (el: ClicksElement, info: Pick<ClicksInfo, 'delta' | 'max'>) => void
  unregister: (el: ClicksElement) => void
  onMounted: () => void
  readonly currentOffset: number
  readonly total: number
}
