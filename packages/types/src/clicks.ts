import type { ComputedRef } from 'vue'

export type RawSingleAtValue = null | undefined | boolean | string | number
export type RawRangeAtValue = null | undefined | false | [string | number, string | number]
export type RawAtValue = RawSingleAtValue | RawRangeAtValue

export type NormalizedSingleClickValue =
  | number // since absolute click
  | string // since relative click
  | null // disabled
export type NormalizedRangeClickValue =
  | [number, number] // [absolute start, absolute end]
  | [number, string] // [absolute start, absolute end based on start]
  | [string, number] // [relative start, absolute end]
  | [string, string] // [relative start, relative end]
  | [string | number, string | number] // make TypeScript happy
  | null // disabled
export type NormalizedAtValue =
  | NormalizedSingleClickValue // since
  | NormalizedRangeClickValue // range

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
   * currentClicks - start
   */
  currentOffset: ComputedRef<number>
  /**
   * currentOffset === 0
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
  readonly relativeSizeMap: Map<ClicksElement, number>
  readonly maxMap: Map<ClicksElement, number>
  calculateSince: (at: RawSingleAtValue, size?: number) => ClicksInfo | null
  calculateRange: (at: RawRangeAtValue) => ClicksInfo | null
  calculate: (at: RawAtValue) => ClicksInfo | null
  register: (el: ClicksElement, info: Pick<ClicksInfo, 'delta' | 'max'> | null) => void
  unregister: (el: ClicksElement) => void
  readonly isMounted: boolean
  setup: () => void
  readonly currentOffset: number
  readonly total: number
}
