import type { SlideRoute } from '@slidev/types'

/** Horizontal navigation starts at the top of the adjacent column. */
export function getGridTarget(slides: SlideRoute[], currentNo: number, colDelta: number, rowDelta: number) {
  const current = slides.find(s => s.no === currentNo)?.meta.slide
  if (!current)
    return
  const col = (current.gridCol ?? 0) + colDelta
  const row = colDelta ? 0 : (current.gridRow ?? 0) + rowDelta
  return slides.find(s => s.meta.slide?.gridCol === col && s.meta.slide?.gridRow === row)
}
