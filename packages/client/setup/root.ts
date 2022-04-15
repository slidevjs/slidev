/* __imports__ */
import { watch } from 'vue'
import { useHead } from '@vueuse/head'
import { configs } from '../env'
import { initSharedState, onPatch, patch } from '../state/shared'
import { initDrawingState } from '../state/drawings'
import { clicks, currentPage, getPath, isPresenter } from '../logic/nav'
import { router } from '../routes'

export default function setupRoot() {
  // @ts-expect-error injected in runtime
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg = undefined

  /* __injections__ */

  const title = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
  useHead({ title })
  initSharedState(`${title} - shared`)
  initDrawingState(`${title} - drawings`)

  // update shared state
  function updateSharedState() {
    if (isPresenter.value) {
      patch('page', +currentPage.value)
      patch('clicks', clicks.value)
    }
  }
  router.afterEach(updateSharedState)
  watch(clicks, updateSharedState)

  onPatch((state) => {
    if (+state.page !== +currentPage.value || clicks.value !== state.clicks) {
      router.replace({
        path: getPath(state.page),
        query: {
          ...router.currentRoute.value.query,
          clicks: state.clicks || 0,
        },
      })
    }
  })
}
