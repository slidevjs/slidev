import { reactive, toRaw, watch } from 'vue'
import serverState from 'server-reactive:nav'

import { clicks, currentPage, getPath, isPresenter } from '../logic/nav'
import { router } from '../routes'

export interface SharedState {
  page: number
  clicks: number
  cursor?: {
    x: number
    y: number
  }
}

export const sharedState = __DEV__
  ? serverState
  : reactive<SharedState>({
    page: 1,
    clicks: 0,
  })

export function initSharedState(title: string) {
  let stateChannel: BroadcastChannel
  if (!__DEV__) {
    stateChannel = new BroadcastChannel(`${title} - state`)
    stateChannel.addEventListener('message', (event: MessageEvent<SharedState>) => {
      if (!isPresenter.value)
        Object.entries(event.data).forEach(([key, value]) => sharedState[key as keyof SharedState] = value)
    })
  }

  function onSharedStateChanged() {
    if (isPresenter.value && stateChannel)
      stateChannel.postMessage(toRaw(sharedState))
    if (+sharedState.page !== +currentPage.value || clicks.value !== sharedState.clicks) {
      router.replace({
        path: getPath(sharedState.page),
        query: {
          ...router.currentRoute.value.query,
          clicks: sharedState.clicks || 0,
        },
      })
    }
  }

  function updateSharedState() {
    if (isPresenter.value) {
      sharedState.page = +currentPage.value
      sharedState.clicks = clicks.value
    }
  }

  // upload state to server
  router.afterEach(updateSharedState)
  watch(clicks, updateSharedState)

  // sync with server state
  router.isReady().then(() => {
    watch(sharedState, onSharedStateChanged, { deep: true })
    updateSharedState()
  })
}
