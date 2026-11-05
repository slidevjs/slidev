import type { SlideRoute } from '@slidev/types'
import { getExportClickSteps, resolveExportClicks } from '@slidev/parser/utils'
import { computed } from 'vue'
import { CLICKS_MAX } from '../constants'
import { createFixedClicks } from './useClicks'
import { useNav } from './useNav'

/**
 * The click steps a slide renders in the print route,
 * from the `withClicks` export option and the slide's `exportClicks` frontmatter
 */
export function usePrintClicks(route: SlideRoute) {
  const { isPrintWithClicks } = useNav()

  const exportClicks = computed(() => resolveExportClicks(route.meta.slide?.frontmatter.exportClicks, isPrintWithClicks.value))

  // the first page also measures the total clicks. null skips the slide (`exportClicks: []`)
  const firstClick = computed(() => {
    const steps = exportClicks.value
    if (steps === false)
      return CLICKS_MAX
    if (steps === true)
      return 0
    if (!steps.length)
      return null
    const first = Math.min(...steps.map(step => typeof step === 'number' ? step : step[0]))
    return Number.isFinite(first) ? first : CLICKS_MAX
  })

  const clicks0 = createFixedClicks(route, () => firstClick.value ?? CLICKS_MAX)

  // clicks0.total can be any number >=0 when rendering, so this is empty in intermediate states
  const extraClicks = computed(() => {
    const steps = exportClicks.value
    if (steps === false)
      return []
    return getExportClickSteps(steps, clicks0.clicksStart, clicks0.total)
      .filter(i => i > clicks0.current)
  })

  return { clicks0, firstClick, extraClicks }
}
