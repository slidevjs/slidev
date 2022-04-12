import { computed, markRaw, nextTick, reactive, ref, watch, watchEffect } from 'vue'
import type { Brush, Options as DrauuOptions, DrawingMode } from 'drauu'
import { createDrauu } from 'drauu'
import { toReactive, useStorage } from '@vueuse/core'
import { configs, serverDrawingState as drawingState } from '../env'
import { currentPage, isPresenter } from './nav'

export const brushColors = [
  '#ff595e',
  '#ffca3a',
  '#8ac926',
  '#1982c4',
  '#6a4c93',
  '#ffffff',
  '#000000',
]

export const drawingEnabled = useStorage('slidev-drawing-enabled', false)
export const drawingPinned = useStorage('slidev-drawing-pinned', false)
export const canUndo = ref(false)
export const canRedo = ref(false)
export const canClear = ref(false)
export const isDrawing = ref(false)

export const brush = toReactive(useStorage<Brush>('slidev-drawing-brush', {
  color: brushColors[0],
  size: 4,
  mode: 'stylus',
}))

const _mode = ref<DrawingMode | 'arrow'>('stylus')
let disableDump = false
export const drawingMode = computed({
  get() {
    return _mode.value
  },
  set(v: DrawingMode | 'arrow') {
    _mode.value = v
    if (v === 'arrow') {
      brush.mode = 'line'
      brush.arrowEnd = true
    }
    else {
      brush.mode = v
      brush.arrowEnd = false
    }
  },
})

export const drauuOptions: DrauuOptions = reactive({
  brush,
  acceptsInputTypes: computed(() => drawingEnabled.value ? undefined : ['pen' as const]),
  coordinateTransform: false,
})
export const drauu = markRaw(createDrauu(drauuOptions))

export function clearDrauu() {
  drauu.clear()
  drawingState.$patch({ [currentPage.value]: '' })
}

export function updateState() {
  canRedo.value = drauu.canRedo()
  canUndo.value = drauu.canUndo()
  canClear.value = !!drauu.el?.children.length
}

export function loadCanvas(page?: number) {
  disableDump = true
  const data = drawingState[page || currentPage.value]
  if (data != null)
    drauu.load(data)
  else
    drauu.clear()
  disableDump = false
}

drauu.on('changed', () => {
  updateState()
  if (!disableDump) {
    const dump = drauu.dump()
    const key = currentPage.value
    if ((drawingState[key] || '') !== dump) {
      if (__DEV__)
        drawingState.$patch({ [key]: drauu.dump() })
      else
        drawingState[key] = drauu.dump()
    }
  }
})

if (__DEV__) {
  drawingState.$onPatch((patch) => {
    disableDump = true
    if (patch[currentPage.value] != null)
      drauu.load(patch[currentPage.value] || '')
    disableDump = false
    updateState()
  })
}

nextTick(() => {
  watch(currentPage, () => {
    if (!drauu.mounted)
      return
    loadCanvas()
  }, { immediate: true })

  watchEffect(() => {
    drawingState.$syncUp = configs.drawings.syncAll || isPresenter.value
  })
})

drauu.on('start', () => isDrawing.value = true)
drauu.on('end', () => isDrawing.value = false)

window.addEventListener('keydown', (e) => {
  if (!drawingEnabled.value)
    return

  const noModifier = !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey
  let handled = true
  if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
    if (e.shiftKey)
      drauu.redo()
    else
      drauu.undo()
  }
  else if (e.code === 'Escape') {
    drawingEnabled.value = false
  }
  else if (e.code === 'KeyL' && noModifier) {
    drawingMode.value = 'line'
  }
  else if (e.code === 'KeyA' && noModifier) {
    drawingMode.value = 'arrow'
  }
  else if (e.code === 'KeyS' && noModifier) {
    drawingMode.value = 'stylus'
  }
  else if (e.code === 'KeyR' && noModifier) {
    drawingMode.value = 'rectangle'
  }
  else if (e.code === 'KeyE' && noModifier) {
    drawingMode.value = 'ellipse'
  }
  else if (e.code === 'KeyC' && noModifier) {
    clearDrauu()
  }
  else if (e.code.startsWith('Digit') && noModifier && +e.code[5] <= brushColors.length) {
    brush.color = brushColors[+e.code[5] - 1]
  }
  else {
    handled = false
  }

  if (handled) {
    e.preventDefault()
    e.stopPropagation()
  }
}, false)

export { drawingState }
