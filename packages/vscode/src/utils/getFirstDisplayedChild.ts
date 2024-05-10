import type { SourceSlideInfo } from '@slidev/types'

/**
 * If `source` is displayed in the slides, return itself.
 *
 * Otherwise, return the recursively first child slide imported by `source`.
 */
export function getFirstDisplayedChild(source: SourceSlideInfo) {
  while (true) {
    const firstChild = source.imports?.[0]
    if (firstChild)
      source = firstChild
    else
      return source
  }
}
