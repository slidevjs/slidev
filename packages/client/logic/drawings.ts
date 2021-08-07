import { computed, markRaw, nextTick, reactive, ref, watch } from 'vue'
import { Brush, createDrauu, DrawingMode } from 'drauu'
import { serverDrawingState } from '../env'
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

export const brush = reactive<Brush>({
  color: brushColors[0],
  size: 4,
  mode: 'draw',
  simplify: true,
})

const _mode = ref<DrawingMode | 'arrow'>('draw')

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

export const drawingEnabled = ref(false)
export const canUndo = ref(false)
export const canRedo = ref(false)
export const canClear = ref(false)
export const isDrawing = ref(false)

export const drauuData = serverDrawingState

serverDrawingState.send = false

nextTick(() => {
  watch(isPresenter, (v) => {
    serverDrawingState.send = v
    serverDrawingState.receive = !v
  }, { immediate: true })
})

export const drauu = markRaw(createDrauu(reactive({
  brush,
})))

export function clearDrauu() {
  drauu.clear()
  drauuData.value[currentPage.value] = ''
}

if (__DEV__) {
  drauu.on('changed', () => {
    canRedo.value = drauu.canRedo()
    canUndo.value = drauu.canUndo()
    canClear.value = !!drauu.el?.children.length
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
    else if (e.code === 'KeyD' && noModifier) {
      drawingMode.value = 'draw'
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
}
