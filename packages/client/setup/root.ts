import { computed, getCurrentInstance, reactive, ref, shallowRef, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useRouter } from 'vue-router'
import { configs } from '../env'
import { initSharedState, onPatch, patch } from '../state/shared'
import { initDrawingState } from '../state/drawings'
import { TRUST_ORIGINS, injectionClicksContext, injectionCurrentPage, injectionRenderContext, injectionSlidevContext } from '../constants'
import { skipTransition } from '../logic/hmr'
import { makeId } from '../logic/utils'
import { getSlidePath } from '../logic/slides'
import { createFixedClicks } from '../composables/useClicks'
import { isDark } from '../logic/dark'
import { useNav } from '../composables/useNav'
import setups from '#slidev/setups/root'

export default function setupRoot() {
  const app = getCurrentInstance()!.appContext.app

  const context = reactive({
    nav: useNav(),
    configs,
    themeConfigs: computed(() => configs.themeConfig),
  })
  app.provide(injectionRenderContext, ref('none'))
  app.provide(injectionSlidevContext, context)
  app.provide(injectionCurrentPage, computed(() => context.nav.currentSlideNo))
  app.provide(injectionClicksContext, shallowRef(createFixedClicks()))

  // allows controls from postMessages
  if (__DEV__) {
    // @ts-expect-error expose global
    window.__slidev__ = context
    window.addEventListener('message', ({ data }) => {
      if (data && data.target === 'slidev') {
        if (data.type === 'navigate') {
          context.nav.go(+data.no, +data.clicks || 0)
        }
        else if (data.type === 'css-vars') {
          const root = document.documentElement
          for (const [key, value] of Object.entries(data.vars || {}))
            root.style.setProperty(key, value as any)
        }
        else if (data.type === 'color-schema') {
          isDark.value = data.color === 'dark'
        }
      }
    })
  }

  // User Setups
  for (const setup of setups)
    setup()

  const title = configs.titleTemplate.replace('%s', configs.title || 'Slidev')

  const {
    clicksContext,
    currentSlideNo,
    hasPrimarySlide,
    isNotesViewer,
    isPresenter,
  } = useNav()

  useHead({
    title,
    htmlAttrs: configs.htmlAttrs,
  })

  initSharedState(`${title} - shared`)
  initDrawingState(`${title} - drawings`)

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
    }
    else {
      patch('viewerPage', +currentSlideNo.value)
      patch('viewerClicks', clicksContext.value.current)
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
