import { markRaw, reactive, ref, watch } from 'vue'
import { Brush, createDrauu, DrawingMode } from 'drauu'

export const brushColors = [
  '#ff595e',
  '#ffca3a',
  '#8ac926',
  '#1982c4',
  '#6a4c93',
  '#ffffff',
  '#000000',
]

export const drauuBrush = reactive<Brush>({ color: brushColors[0], size: 4 })
export const drauuMode = ref<DrawingMode>('draw')
export const drauuEnabled = ref(false)
export const canUndo = ref(false)
export const canRedo = ref(false)

export const drauu = markRaw(createDrauu({
  brush: drauuBrush,
  mode: drauuMode.value,
}))

drauu.on('changed', () => {
  canRedo.value = drauu.canRedo()
  canUndo.value = drauu.canUndo()
})

watch(drauuMode, mode => drauu.mode = mode)
