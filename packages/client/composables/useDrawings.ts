import { computed, markRaw, nextTick, reactive, ref, watch } from 'vue'
import type { Brush, Options as DrauuOptions, DrawingMode } from 'drauu'
import { createDrauu } from 'drauu'
import { createSharedComposable, toReactive, useLocalStorage } from '@vueuse/core'
import { drawingState, onPatch, patch } from '../state/drawings'
import { configs } from '../env'
import { isInputting } from '../state'
import { useNav } from './useNav'

export const useDrawings = createSharedComposable(() => {
  const { currentSlideNo, isPresenter } = useNav()

  const brushColors = [
    '#ff595e',
    '#ffca3a',
    '#8ac926',
    '#1982c4',
    '#6a4c93',
    '#ffffff',
    '#000000',
  ]

  const drawingEnabled = useLocalStorage('slidev-drawing-enabled', false)
  const drawingPinned = useLocalStorage('slidev-drawing-pinned', false)
  const brush = toReactive(useLocalStorage<Brush>('slidev-drawing-brush', {
    color: brushColors[0],
    size: 4,
    mode: 'stylus',
  }))

  const isDrawing = ref(false)
  const canUndo = ref(false)
  const canRedo = ref(false)
  const canClear = ref(false)

  const _mode = ref<DrawingMode | 'arrow'>('stylus')
  const syncUp = computed(() => configs.drawings.syncAll || isPresenter.value)
  let disableDump = false

  const drawingMode = computed({
    get() {
      return _mode.value
    },
    set(v: DrawingMode | 'arrow') {
      _mode.value = v
      if (v === 'arrow') {
        // eslint-disable-next-line ts/no-use-before-define
        drauu.mode = 'line'
        brush.arrowEnd = true
      }
      else {
        // eslint-disable-next-line ts/no-use-before-define
        drauu.mode = v
        brush.arrowEnd = false
      }
    },
  })

  const drauuOptions: DrauuOptions = reactive({
    brush,
    acceptsInputTypes: computed(() => (drawingEnabled.value && (!configs.drawings.presenterOnly || isPresenter.value)) ? undefined : ['pen' as const]),
    coordinateTransform: false,
  })

  const drauu = markRaw(createDrauu(drauuOptions))

  function clearDrauu() {
    drauu.clear()
    if (syncUp.value)
      patch(currentSlideNo.value, '')
  }

  function updateState() {
    canRedo.value = drauu.canRedo()
    canUndo.value = drauu.canUndo()
    canClear.value = !!drauu.el?.children.length
  }

  function loadCanvas(page?: number) {
    disableDump = true
    const data = drawingState[page || currentSlideNo.value]
    if (data != null)
      drauu.load(data)
    else
      drauu.clear()
    updateState()
    disableDump = false
  }

  drauu.on('changed', () => {
    updateState()
    if (!disableDump) {
      const dump = drauu.dump()
      const key = currentSlideNo.value
      if ((drawingState[key] || '') !== dump && syncUp.value)
        patch(key, drauu.dump())
    }
  })

  onPatch((state) => {
    disableDump = true
    if (state[currentSlideNo.value] != null)
      drauu.load(state[currentSlideNo.value] || '')
    disableDump = false
    updateState()
  })

  nextTick(() => {
    watch(currentSlideNo, () => {
      if (!drauu.mounted)
        return
      loadCanvas()
    }, { immediate: true })
  })

  drauu.on('start', () => isDrawing.value = true)
  drauu.on('end', () => isDrawing.value = false)

  window.addEventListener('keydown', (e) => {
    if (!drawingEnabled.value || isInputting.value)
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

  return {
    brush,
    brushColors,
    canClear,
    canRedo,
    canUndo,
    clear: clearDrauu,
    drauu,
    drauuOptions,
    drawingEnabled,
    drawingMode,
    drawingPinned,
    drawingState,
    isDrawing,
    loadCanvas,
  }
})
