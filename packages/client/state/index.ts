import { useMagicKeys, useActiveElement, useStorage, useUrlSearchParams, useBreakpoints, breakpointsTailwind, useWindowSize } from '@vueuse/core'
import { computed, ref } from 'vue'

export const showOverview = ref(false)
export const showEditor = ref(false)
export const showRecordingDialog = ref(false)

export const query = useUrlSearchParams()
export const breakpoints = useBreakpoints(breakpointsTailwind)
export const windowSize = useWindowSize()
export const magicKeys = useMagicKeys()

export const activeElement = useActiveElement()
export const isInputing = computed(() => ['INPUT', 'TEXTAREA'].includes(activeElement.value?.tagName || ''))

export const currentCamera = useStorage<string>('slidev-camera', 'default')
export const currentMic = useStorage<string>('slidev-mic', 'default')

export const isPrintMode = computed(() => query.print != null)
