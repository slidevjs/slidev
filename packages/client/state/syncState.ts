import { reactive, toRaw, watch } from 'vue'

export function createSyncState<State extends object>(serverState: State, defaultState: State, persist = false) {
  const onPatchCallbacks: ((state: State) => void)[] = []
  let patching = false
  let updating = false
  let patchingTimeout: NodeJS.Timeout
  let updatingTimeout: NodeJS.Timeout

  const state = __SLIDEV_HAS_SERVER__
    ? reactive<State>(serverState) as State
    : reactive<State>(defaultState) as State

  function onPatch(fn: (state: State) => void) {
    onPatchCallbacks.push(fn)
  }

  function patch<K extends keyof State>(key: K, value: State[K]) {
    if (state[key] === value)
      return
    clearTimeout(patchingTimeout)
    patching = true
    state[key] = value
    patchingTimeout = setTimeout(() => patching = false, 0)
  }

  function onUpdate(patch: Partial<State>) {
    if (!patching) {
      clearTimeout(updatingTimeout)
      updating = true
      Object.entries(patch).forEach(([key, value]) => {
        state[key as keyof State] = value as State[keyof State]
      })
      updatingTimeout = setTimeout(() => updating = false, 0)
    }
  }

  function init(channelKey: string) {
    let stateChannel: BroadcastChannel
    if (!__SLIDEV_HAS_SERVER__ && !persist) {
      stateChannel = new BroadcastChannel(channelKey)
      stateChannel.addEventListener('message', (event: MessageEvent<Partial<State>>) => onUpdate(event.data))
    }
    else if (!__SLIDEV_HAS_SERVER__ && persist) {
      window.addEventListener('storage', (event) => {
        if (event && event.key === channelKey && event.newValue)
          onUpdate(JSON.parse(event.newValue) as Partial<State>)
      })
    }

    function onStateChanged() {
      if (!persist && stateChannel && !updating)
        stateChannel.postMessage(toRaw(state))
      else if (persist && !updating)
        window.localStorage.setItem(channelKey, JSON.stringify(state))
      if (!patching)
        onPatchCallbacks.forEach((fn: (state: State) => void) => fn(state))
    }

    watch(state, onStateChanged, { deep: true, flush: 'sync' })

    if (!__SLIDEV_HAS_SERVER__ && persist) {
      const serialzedState = window.localStorage.getItem(channelKey)
      if (serialzedState)
        onUpdate(JSON.parse(serialzedState) as Partial<State>)
    }
  }

  return { init, onPatch, patch, state }
}
