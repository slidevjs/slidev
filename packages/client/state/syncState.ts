import type { UnwrapNestedRefs } from 'vue'
import { reactive, toRaw, watch } from 'vue'

export function createSyncState<State extends object>(serverState: State, defaultState: State) {
  const onPatchCallbacks: ((state: UnwrapNestedRefs<State>) => void)[] = []
  let patching = false
  let updating = false
  let patchingTimeout: NodeJS.Timeout
  let updatingTimeout: NodeJS.Timeout

  const state = __DEV__
    ? reactive<State>(serverState) // serverState
    : reactive<State>(defaultState)

  function onPatch(fn: (state: UnwrapNestedRefs<State>) => void) {
    onPatchCallbacks.push(fn)
  }

  function patch<K extends keyof State, V = State[K]>(key: K, value: V) {
    clearTimeout(patchingTimeout)
    patching = true
    // @ts-expect-error fixme
    state[key] = value
    patchingTimeout = setTimeout(() => patching = false, 0)
  }

  function init(channelKey: string) {
    let stateChannel: BroadcastChannel
    if (!__DEV__) {
      stateChannel = new BroadcastChannel(channelKey)
      stateChannel.addEventListener('message', (event: MessageEvent<State>) => {
        if (!patching) {
          clearTimeout(updatingTimeout)
          updating = true
          Object.entries(event.data).forEach(([key, value]) => {
            // @ts-expect-error fixme
            state[key as keyof State] = value
          })
          updatingTimeout = setTimeout(() => updating = false, 0)
        }
      })
    }

    function onDrawingStateChanged() {
      if (stateChannel && !updating)
        stateChannel.postMessage(toRaw(state))
      if (!patching)
        onPatchCallbacks.forEach((fn: (state: UnwrapNestedRefs<State>) => void) => fn(state))
    }

    watch(state, onDrawingStateChanged, { deep: true })
  }

  return { init, onPatch, patch, state }
}
