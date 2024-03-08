import { watch } from 'vue'
import { useHead } from '@unhead/vue'
import { configs } from '../env'
import { initSharedState, onPatch, patch } from '../state/shared'
import { initDrawingState } from '../state/drawings'
import { clicksContext, currentSlideNo, getSlidePath, hasPrimarySlide, isNotesViewer, isPresenter } from '../logic/nav'
import { router } from '../routes'
import { TRUST_ORIGINS } from '../constants'
import { skipTransition } from '../composables/hmr'
import { makeId } from '../logic/utils'
import setups from '#slidev/setups/root'

export default function setupRoot() {
  for (const setup of setups)
    setup()

  const title = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
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
  router.afterEach(updateSharedState)
  watch(clicksContext, updateSharedState)

  onPatch((state) => {
    if (!hasPrimarySlide.value)
      return
    if (state.lastUpdate?.type === 'presenter' && (+state.page !== +currentSlideNo.value || +clicksContext.value.current !== +state.clicks)) {
      skipTransition.value = false
      router.replace({
        path: getSlidePath(state.page),
        query: {
          ...router.currentRoute.value.query,
          clicks: state.clicks || 0,
        },
      })
    }
  })
}
