import { watch } from 'vue'
import { createSharedComposable } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useNavBase } from '../composables/useNav'
import { getSlide } from './slides'
import { useNavState } from './nav-state'

export const useNav = createSharedComposable(() => {
  const {
    clicksContext,
    currentSlideRoute,
    queryClicks,
    currentRoute,
    hasPrimarySlide,
    isPresenter,
  } = useNavState()
  const router = useRouter()

  const nav = useNavBase(
    currentSlideRoute,
    clicksContext,
    queryClicks,
    isPresenter,
    router,
  )

  watch(
    [nav.total, currentRoute],
    async () => {
      if (hasPrimarySlide.value && !getSlide(currentRoute.value.params.no as string)) {
        // The current slide may has been removed. Redirect to the last slide.
        await nav.goLast()
      }
    },
    { flush: 'pre', immediate: true },
  )

  return nav
})
