/* __imports__ */
import { useHead } from '@vueuse/head'
import { watch } from 'vue'
import { clicks, currentPage, getPath, isPresenter } from '../logic/nav'
import { router } from '../routes'
import { configs, serverState } from '../env'

export default function setupRoot() {
  // @ts-expect-error injected in runtime
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg = undefined

  /* __injections__ */

  useHead({
    title: configs.titleTemplate.replace('%s', configs.title || 'Slidev'),
  })

  function onServerStateChanged() {
    if (isPresenter.value)
      return
    if (+serverState.page !== +currentPage.value || clicks.value !== serverState.clicks) {
      router.replace({
        path: getPath(serverState.page),
        query: {
          ...router.currentRoute.value.query,
          clicks: serverState.clicks || 0,
        },
      })
    }
  }
  function updateServerState() {
    if (isPresenter.value) {
      serverState.page = +currentPage.value
      serverState.clicks = clicks.value
    }
  }

  // upload state to server
  router.afterEach(updateServerState)
  watch(clicks, updateServerState)

  // sync with server state
  router.isReady().then(() => {
    watch(serverState, onServerStateChanged, { deep: true })
  })
}
