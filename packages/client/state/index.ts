import { useMagicKeys, useActiveElement, useStorage, useUrlSearchParams } from '@vueuse/core'
import { computed, ref } from 'vue'

export const activeElement = useActiveElement()
export const isInputing = computed(() => ['INPUT', 'TEXTAREA'].includes(activeElement.value?.tagName || ''))

export const magicKeys = useMagicKeys()
export const showOverview = ref(false)
export const showEditor = ref(false)

export const currentCamera = useStorage<string>('slidev-camera', 'default')
export const currentMic = useStorage<string>('slidev-mic', 'default')

export const query = useUrlSearchParams()
