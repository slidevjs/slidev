import { computed, ref } from 'vue'
import { getGridTarget } from './grid'
import { slides } from './slides'

// To have same format(.value) as max, wrap it with ref.
const min = ref(1)
const max = computed(() => slides.value.length)

export const currentOverviewPage = ref(0)
export const overviewRowCount = ref(0)

function moveInGrid(colDelta: number, rowDelta: number) {
  if (!slides.value.some(s => (s.meta.slide?.gridRow ?? 0) > 0))
    return false
  const target = getGridTarget(slides.value, currentOverviewPage.value, colDelta, rowDelta)
  if (target)
    currentOverviewPage.value = target.no
  return true
}

export function prevOverviewPage() {
  if (moveInGrid(-1, 0))
    return
  if (currentOverviewPage.value > min.value)
    currentOverviewPage.value -= 1
}

export function nextOverviewPage() {
  if (moveInGrid(1, 0))
    return
  if (currentOverviewPage.value < max.value)
    currentOverviewPage.value += 1
}

export function upOverviewPage() {
  if (moveInGrid(0, -1))
    return
  if (currentOverviewPage.value > min.value) {
    let current = currentOverviewPage.value - overviewRowCount.value
    if (current < min.value)
      current = min.value

    currentOverviewPage.value = current
  }
}

export function downOverviewPage() {
  if (moveInGrid(0, 1))
    return
  if (currentOverviewPage.value < max.value) {
    let current = currentOverviewPage.value + overviewRowCount.value
    if (current > max.value)
      current = max.value

    currentOverviewPage.value = current
  }
}
