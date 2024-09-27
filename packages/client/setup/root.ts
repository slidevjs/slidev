import setups from '#slidev/setups/root'
import { useHead } from '@unhead/vue'
import { computed, getCurrentInstance, reactive, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createFixedClicks } from '../composables/useClicks'
import { useEmbeddedControl } from '../composables/useEmbeddedCtrl'
import { useNav } from '../composables/useNav'
import { injectionClicksContext, injectionCurrentPage, injectionRenderContext, injectionSlidevContext, TRUST_ORIGINS } from '../constants'
import { configs, slidesTitle } from '../env'
import { skipTransition } from '../logic/hmr'
import { getSlidePath } from '../logic/slides'
import { makeId } from '../logic/utils'
import { initDrawingState } from '../state/drawings'
import { initSharedState, onPatch, patch } from '../state/shared'

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
  } = useNav()

  useHead({
    title: slidesTitle,
    htmlAttrs: configs.htmlAttrs,
  })

  initSharedState(`${slidesTitle} - shared`)
  initDrawingState(`${slidesTitle} - drawings`)

  const id = `${location.origin}_${makeId()}`

  // update shared state
  function updateSharedState() {
    if (isNotesViewer.value)
      return

    // we allow Presenter mode, or Viewer mode from trusted origins to update the shared state
    if (!isPresenter.value && !TRUST_ORIGINS.includes(location.host.split(':')[0]))
      return

    if (isPresenter.value) {
      patch('page', +currentSlideNo.value)
      patch('clicks', clicksContext.value.current)
      patch('clicksTotal', clicksContext.value.total)
    }
    else {
      patch('viewerPage', +currentSlideNo.value)
      patch('viewerClicks', clicksContext.value.current)
      patch('viewerClicksTotal', clicksContext.value.total)
    }

    patch('lastUpdate', {
      id,
      type: isPresenter.value ? 'presenter' : 'viewer',
      time: new Date().getTime(),
    })
  }
  const router = useRouter()
  router.afterEach(updateSharedState)
  watch(clicksContext, updateSharedState)

  onPatch((state) => {
    if (!hasPrimarySlide.value)
      return
    if (state.lastUpdate?.type === 'presenter' && (+state.page !== +currentSlideNo.value || +clicksContext.value.current !== +state.clicks)) {
      skipTransition.value = false
      router.replace({
        path: getSlidePath(state.page, isPresenter.value),
        query: {
          ...router.currentRoute.value.query,
          clicks: state.clicks || 0,
        },
      })
    }
  })
}
