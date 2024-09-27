import { reactive, ref, toRaw, watch } from 'vue'

export type SyncWrite<State extends object> = (state: State, updating?: boolean) => void

export interface Sync {
  enabled?: boolean
  init: <State extends object>(channelKey: string, onUpdate: (data: Partial<State>) => void, state: State, persist?: boolean) => SyncWrite<State> | undefined
}

interface BuiltinSync extends Sync {
  channels: BroadcastChannel[]
  disable: () => void
  listener?: (event: StorageEvent) => void
}

const builtinSync: BuiltinSync = {
  channels: [],
  enabled: true,
  init<State extends object>(channelKey: string, onUpdate: (data: Partial<State>) => void, state: State, persist = false) {
    let stateChannel: BroadcastChannel
    if (!__SLIDEV_HAS_SERVER__ && !persist) {
      stateChannel = new BroadcastChannel(channelKey)
      stateChannel.addEventListener('message', (event: MessageEvent<Partial<State>>) => onUpdate(event.data))
      this.channels.push(stateChannel)
    }
    else if (!__SLIDEV_HAS_SERVER__ && persist) {
      this.listener = function (event: StorageEvent) {
        if (event && event.key === channelKey && event.newValue)
          onUpdate(JSON.parse(event.newValue) as Partial<State>)
      }
      window.addEventListener('storage', this.listener)
      const serializedState = window.localStorage.getItem(channelKey)
      if (serializedState)
        onUpdate(JSON.parse(serializedState) as Partial<State>)
    }
    return (state: State, updating = false) => {
      if (this.enabled) {
        if (!persist && stateChannel && !updating)
          stateChannel.postMessage(toRaw(state))
        if (persist && !updating)
          window.localStorage.setItem(channelKey, JSON.stringify(state))
      }
    }
  },
  disable() {
    this.enabled = false
    this.channels.forEach(channel => channel.close())
    if (this.listener) {
      window.removeEventListener('storage', this.listener)
    }
  },
}
const syncInterfaces: Sync[] = reactive([builtinSync])
const channels: Map<string, { onUpdate: (data: Partial<object>) => void, persist?: boolean, state: object }> = new Map()
const syncWrites = ref<Record<string, SyncWrite<object>[]>>({})

export function disableBuiltinSync() {
  builtinSync.disable()
}

export function addSyncMethod(sync: Sync) {
  syncInterfaces.push(sync)
  for (const [channelKey, { onUpdate, persist, state }] of channels.entries()) {
    const write = sync.init(channelKey, onUpdate, state, persist)
    if (write) {
      syncWrites.value[channelKey].push(write)
    }
  }
}

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
    channels.set(channelKey, { onUpdate, persist, state })
    syncWrites.value[channelKey] = syncInterfaces
      .map(sync => sync.init<State>(channelKey, onUpdate, state, persist))
      .filter((x): x is SyncWrite<object> => Boolean(x))

    function onStateChanged() {
      syncWrites.value[channelKey].forEach(write => write?.(toRaw(state), updating))
      if (!patching)
        onPatchCallbacks.forEach((fn: (state: State) => void) => fn(state))
    }

    watch(state, onStateChanged, { deep: true })
  }

  return { init, onPatch, onUpdate, patch, state }
}
