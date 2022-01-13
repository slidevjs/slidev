import { breakpointsTailwind, isClient, useActiveElement, useBreakpoints, useFullscreen, useMagicKeys, useStorage, useToggle, useWindowSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { slideAspect } from '../env'

export const showRecordingDialog = ref(false)
export const showInfoDialog = ref(false)
export const showGotoDialog = ref(false)

export const shortcutsEnabled = ref(true)
export const breakpoints = useBreakpoints({
  xs: 460,
  ...breakpointsTailwind,
})
export const windowSize = useWindowSize()
export const magicKeys = useMagicKeys()
export const isScreenVertical = computed(() => windowSize.height.value - windowSize.width.value / slideAspect > 180)
export const fullscreen = useFullscreen(isClient ? document.body : null)

export const activeElement = useActiveElement()
export const isInputting = computed(() => ['INPUT', 'TEXTAREA'].includes(activeElement.value?.tagName || '') || activeElement.value?.classList.contains('CodeMirror-code'))
export const isOnFocus = computed(() => ['BUTTON', 'A'].includes(activeElement.value?.tagName || ''))

export const currentCamera = useStorage<string>('slidev-camera', 'default')
export const currentMic = useStorage<string>('slidev-mic', 'default')
export const slideScale = useStorage<number>('slidev-scale', 0)

export const showOverview = useStorage('slidev-show-overview', false)
export const showPresenterCursor = useStorage('slidev-presenter-cursor', true)
export const showEditor = useStorage('slidev-show-editor', false)
export const editorWidth = useStorage('slidev-editor-width', isClient ? window.innerWidth * 0.4 : 100)

export const toggleOverview = useToggle(showOverview)
