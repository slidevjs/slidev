import { computed, ref } from 'vue'
import { slides } from './slides'

// To have same format(.value) as max, wrap it with ref.
const min = ref(1)
const max = computed(() => slides.value.length)

export const currentOverviewPage = ref(0)
export const overviewRowCount = ref(0)

export function prevOverviewPage() {
  if (currentOverviewPage.value > min.value)
    currentOverviewPage.value -= 1
}

export function nextOverviewPage() {
  if (currentOverviewPage.value < max.value)
    currentOverviewPage.value += 1
}

export function upOverviewPage() {
  if (currentOverviewPage.value > min.value) {
    let current = currentOverviewPage.value - overviewRowCount.value
    if (current < min.value)
      current = min.value

    currentOverviewPage.value = current
  }
}

export function downOverviewPage() {
  if (currentOverviewPage.value < max.value) {
    let current = currentOverviewPage.value + overviewRowCount.value
    if (current > max.value)
      current = max.value

    currentOverviewPage.value = current
  }
}
