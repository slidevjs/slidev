/* __imports__ */
import { useHead } from '@vueuse/head'
import { watch } from 'vue'
import { AppContext } from '@slidev/types'
import { currentPage, getPath, tab, isPresenter } from '../logic/nav'
import { router } from '../routes'
// @ts-expect-error
import configs from '/@slidev/configs'
// @ts-expect-error
import serverState from '/@server-ref/state'

export default function setupApp(context: AppContext) {
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg = context

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
        tab.value = serverState.value.tab || 0
      },
      { deep: true },
    )
  })

  // upload state to server
  function updateServerState() {
    if (isPresenter.value) {
      serverState.value.page = +currentPage.value
      serverState.value.tab = tab.value
    }
  }

  watch(tab, updateServerState)
}
