import type { SharedState } from '../state/shared'
import { useHead } from '@unhead/vue'
import { computed, getCurrentInstance, reactive, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import setups from '#slidev/setups/root'
import { createFixedClicks } from '../composables/useClicks'
import { useEmbeddedControl } from '../composables/useEmbeddedCtrl'
import { useNav } from '../composables/useNav'
import { usePrintStyles } from '../composables/usePrintStyles'
import { injectionClicksContext, injectionCurrentPage, injectionRenderContext, injectionSlidevContext, TRUST_ORIGINS } from '../constants'
import { configs, slidesTitle } from '../env'
import { getSlidePath } from '../logic/slides'
import { makeId } from '../logic/utils'
import { hmrSkipTransition, syncDirections } from '../state'
import { initDrawingState } from '../state/drawings'
import { initSharedState, onPatch, patch, sharedState } from '../state/shared'

export default function setupRoot() {
  const app = getCurrentInstance()!.appContext.app

  const context = reactive({
    nav: useNav(),
    configs,
    themeConfigs: computed(() => configs.themeConfig),
  })
  app.provide(injectionRenderContext, ref('none' as const))
  app.provide(injectionSlidevContext, context)
  app.provide(injectionCurrentPage, computed(() => context.nav.currentSlideNo))
  app.provide(injectionClicksContext, shallowRef(createFixedClicks()))

  // allows controls from postMessages
  if (__DEV__) {
    // @ts-expect-error expose global
    window.__slidev__ = context
    useEmbeddedControl()
  }

  // User Setups
  for (const setup of setups)
    setup()

  const {
    clicksContext,
    currentSlideNo,
    hasPrimarySlide,
    isNotesViewer,
    isPresenter,
    isPrintMode,
    queryClicks,
  } = useNav()

  useHead({
    title: slidesTitle,
    htmlAttrs: configs.htmlAttrs,
  })

  usePrintStyles()

  initSharedState(`${slidesTitle} - shared`)
  initDrawingState(`${slidesTitle} - drawings`)

  const id = `${location.origin}_${makeId()}`
  const syncType = computed(() => isPresenter.value ? 'presenter' : 'viewer')

  // Where this window was moved by the shared state (following another window, or joining
  // on load). Standing there is not a move of this window, so nothing is sent: writing it
  // back would be an echo, and on a slow connection an echo can arrive after a newer move
  // and pull every other window back.
  let followed: { page: number, clicks: number } | undefined
  // The position a follow is still navigating to: the route changes only when it arrives.
  let pending: { page: number, clicks: number } | undefined
  // Nothing is sent until the window has joined the shared position on load.
  let loading = true

  // update shared state
  function updateSharedState() {
    if (loading)
      return

    const shouldSend = isPresenter.value
      ? syncDirections.value.presenterSend
      : syncDirections.value.viewerSend

    if (!shouldSend)
      return
    if (isNotesViewer.value || isPrintMode.value)
      return
    // we allow Presenter mode, or Viewer mode from trusted origins to update the shared state
    if (!isPresenter.value && !TRUST_ORIGINS.includes(location.host.split(':')[0]))
      return

    if (followed) {
      if (followed.page === +currentSlideNo.value && followed.clicks === queryClicks.value)
        return
      followed = undefined
    }

    patch('page', +currentSlideNo.value)
    patch('clicks', clicksContext.value.current)
    patch('clicksTotal', clicksContext.value.total)
    patch('lastUpdate', {
      id,
      type: syncType.value,
      time: Date.now(),
    })
  }
  const router = useRouter()
  router.afterEach((_to, _from, failure) => {
    // a failed or cancelled navigation moved nothing
    if (!failure)
      updateSharedState()
  })
  watch(clicksContext, updateSharedState)

  function shouldReceive() {
    return isPresenter.value
      ? syncDirections.value.presenterReceive
      : syncDirections.value.viewerReceive
  }

  function follow(state: SharedState) {
    const target = { page: +state.page, clicks: +state.clicks || 0 }
    followed = pending = target
    hmrSkipTransition.value = false
    return router.replace({
      path: getSlidePath(state.page, isPresenter.value),
      query: {
        ...router.currentRoute.value.query,
        clicks: state.clicks || 0,
      },
    })
      .finally(() => {
        if (pending === target)
          pending = undefined
      })
  }

  onPatch((state) => {
    if (!shouldReceive())
      return
    if (!hasPrimarySlide.value || isPrintMode.value)
      return
    // only this window's own updates are skipped: any other window, presenter or viewer, may lead
    if (state.lastUpdate?.id === id)
      return
    // already there, or on the way there
    const at = pending ?? { page: +currentSlideNo.value, clicks: clicksContext.value.current }
    if (+state.page === at.page && (+state.clicks || 0) === at.clicks)
      return
    follow(state)
  })

  // A window that loads (a reload, a restored tab, a second presenter view) joins the shared
  // position instead of moving everyone to the slide in its URL. Only when nothing has been
  // shared yet does its own position become the shared one.
  router.isReady()
    .then(async () => {
      if (!__SLIDEV_HAS_SERVER__ || !(+sharedState.page > 0)) {
        loading = false
        updateSharedState()
        return
      }
      if (shouldReceive() && hasPrimarySlide.value && !isPrintMode.value
        // the URL's clicks: before the slide mounts, the clicks context reads 0
        && (+sharedState.page !== +currentSlideNo.value || (+sharedState.clicks || 0) !== queryClicks.value)) {
        await follow(sharedState)
      }
      else {
        followed = { page: +currentSlideNo.value, clicks: queryClicks.value }
      }
    })
    .finally(() => {
      loading = false
    })
}
