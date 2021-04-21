import { useMagicKeys } from '@vueuse/core'
import { ref } from 'vue'
import { useActiveElement } from './use'

export const activeElement = useActiveElement()
export const magicKeys = useMagicKeys()
export const showOverview = ref(false)
export const showEditor = ref(false)
