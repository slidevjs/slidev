import { reactive, toRaw, watch } from 'vue'
import serverDrawingState from 'server-reactive:drawings?diff'

export type DrawingsState = Record<number, string | undefined>
export type OnDrawingPatch = (state: DrawingsState) => void

const onPatchCallbacks: OnDrawingPatch[] = []
let patching = false
let updating = false
let patchingTimeout: NodeJS.Timeout
let updatingTimeout: NodeJS.Timeout

export const drawingState = __DEV__
  ? serverDrawingState
  : reactive<DrawingsState>({})

export function onPatch(fn: OnDrawingPatch) {
  onPatchCallbacks.push(fn)
}

export function patch(key: number, dump: string | undefined) {
  clearTimeout(patchingTimeout)
  patching = true
  drawingState[key] = dump
  patchingTimeout = setTimeout(() => patching = false, 0)
}

export function initDrawingsState(title: string) {
  let stateChannel: BroadcastChannel
  if (!__DEV__) {
    stateChannel = new BroadcastChannel(`${title} - state`)
    stateChannel.addEventListener('message', (event: MessageEvent<DrawingsState>) => {
      if (!patching) {
        clearTimeout(updatingTimeout)
        updating = true
        Object.entries(event.data).forEach(([key, value]) => drawingState[+key] = value)
        updatingTimeout = setTimeout(() => updating = false, 0)
      }
    })
  }

  function onDrawingStateChanged() {
    if (stateChannel && !updating)
      stateChannel.postMessage(toRaw(drawingState))
    if (!patching)
      onPatchCallbacks.forEach(fn => fn(drawingState))
  }

  watch(drawingState, onDrawingStateChanged, { deep: true })
}
