import { computed } from 'vue'
import { logicOr } from '@vueuse/math'
import { useRouter } from 'vue-router'
import { createSharedComposable } from '@vueuse/core'
import type { ClicksContext, SlideRoute } from '@slidev/types'
import { configs } from '../env'
import { CLICKS_MAX } from '../constants'
import { createClicksContextBase } from '../composables/useClicks'
import { getSlide, slides } from './slides'
import { useRouteQuery } from './route'

export const useNavState = createSharedComposable(() => {
  const router = useRouter()

  const currentRoute = computed(() => router.currentRoute.value)
  const isPrintMode = computed(() => currentRoute.value.query.print !== undefined)
  const isPrintWithClicks = computed(() => currentRoute.value.query.print === 'clicks')
  const isEmbedded = computed(() => currentRoute.value.query.embedded !== undefined)
  const isPlaying = computed(() => currentRoute.value.name === 'play')
  const isPresenter = computed(() => currentRoute.value.name === 'presenter')
  const isNotesViewer = computed(() => currentRoute.value.name === 'notes')
  const isPresenterAvailable = computed(() => !isPresenter.value && (!configs.remote || currentRoute.value.query.password === configs.remote))
  const hasPrimarySlide = logicOr(isPlaying, isPresenter)

  const currentSlideNo = computed(() => hasPrimarySlide.value ? getSlide(currentRoute.value.params.no as string)?.no ?? 1 : 1)
  const currentSlideRoute = computed(() => slides.value[currentSlideNo.value - 1])

  const queryClicksRaw = useRouteQuery<string>('clicks', '0')

  const clicksContext = computed(() => getPrimaryClicks(currentSlideRoute.value))

  const queryClicks = computed({
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

  function getPrimaryClicks(
    route: SlideRoute,
  ): ClicksContext {
    if (route?.meta?.__clicksContext)
      return route.meta.__clicksContext

    const thisNo = route.no
    const context = createClicksContextBase(
      computed({
        get() {
          if (context.disabled)
            return CLICKS_MAX
          if (currentSlideNo.value === thisNo)
            return +(queryClicksRaw.value || 0) || 0
          else if (currentSlideNo.value > thisNo)
            return CLICKS_MAX
          else
            return 0
        },
        set(v) {
          if (currentSlideNo.value === thisNo)
            queryClicksRaw.value = Math.min(v, context.total).toString()
        },
      }),
      route?.meta?.clicks,
      () => isPrintMode.value && !isPrintWithClicks.value,
    )

    // On slide mounted, make sure the query is not greater than the total
    context.onMounted = () => {
      if (queryClicksRaw.value)
        queryClicksRaw.value = Math.min(+queryClicksRaw.value, context.total).toString()
    }

    if (route?.meta)
      route.meta.__clicksContext = context

    return context
  }

  return {
    router,
    currentRoute,
    isPrintMode,
    isPrintWithClicks,
    isEmbedded,
    isPlaying,
    isPresenter,
    isNotesViewer,
    isPresenterAvailable,
    hasPrimarySlide,
    currentSlideNo,
    currentSlideRoute,
    clicksContext,
    queryClicksRaw,
    queryClicks,
    getPrimaryClicks,
  }
})
