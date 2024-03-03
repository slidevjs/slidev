import { computed, watch } from 'vue'
import { router } from '../routes'
import { usePrimaryClicks } from '../composables/useClicks'
import { CLICKS_MAX } from '../constants'
import { useNavBase } from '../composables/useNav'
import { useRouteQuery } from './route'
import { currentRoute, currentSlideRoute, hasPrimarySlide } from './nav-state'
import { getSlide } from './slides'

export * from './slides'
export * from './nav-state'

export const clicksContext = computed(() => usePrimaryClicks(currentSlideRoute.value))

const queryClicksRaw = useRouteQuery('clicks', '0')
export const queryClicks = computed({
  get() {
    if (clicksContext.value.disabled)
      return CLICKS_MAX
    let v = +(queryClicksRaw.value || 0)
    if (Number.isNaN(v))
      v = 0
    return v
  },
  set(v) {
    queryClicksRaw.value = v.toString()
  },
})

export const {
  slides,
  total,
  currentPath,
  currentSlideNo,
  currentPage,
  currentLayout,
  currentTransition,
  clicksDirection,
  nextRoute,
  prevRoute,
  clicks,
  clicksTotal,
  hasNext,
  hasPrev,
  tocTree,
  navDirection,
  openInEditor,
  next,
  prev,
  go,
  goLast,
  goFirst,
  nextSlide,
  prevSlide,
} = useNavBase(
  currentSlideRoute,
  clicksContext,
  queryClicks,
  router,
)

watch(
  [total, currentRoute],
  async () => {
    if (hasPrimarySlide.value && !getSlide(currentRoute.value.params.no as string)) {
      // The current slide may has been removed. Redirect to the last slide.
      await goLast()
    }
  },
  { flush: 'post', immediate: true },
)
