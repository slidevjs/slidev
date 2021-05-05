/* __imports__ */
import { useHead } from '@vueuse/head'
import { watch } from 'vue'
import { currentPage, getPath, clicks, isPresenter } from '../logic/nav'
import { router } from '../routes'
// @ts-expect-error
import configs from '/@slidev/configs'
// @ts-expect-error
import serverState from '/@server-ref/state'

export default function setupRoot() {
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg = undefined

  /* __injections__ */

  useHead({
    title: configs.title ? `${configs.title} - Slidev` : 'Slidev',
  })

  // sync with server state
  router.afterEach(updateServerState)
  router.isReady().then(() => {
    watch(serverState,
      () => {
        if (isPresenter.value)
          return
        if (+serverState.value.page !== +currentPage.value)
          router.replace(getPath(serverState.value.page))
        clicks.value = serverState.value.clicks || 0
      },
      { deep: true },
    )
  })

  // upload state to server
  function updateServerState() {
    if (isPresenter.value) {
      serverState.value.page = +currentPage.value
      serverState.value.clicks = clicks.value
    }
  }

  watch(clicks, updateServerState)
}
