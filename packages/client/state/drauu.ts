import { reactive, ref } from 'vue'
import { Brush, DrawingMode } from 'drauu'

export const drauuBrush = reactive<Brush>({ color: 'red', size: 4 })
export const drauuMode = ref<DrawingMode>('draw')
