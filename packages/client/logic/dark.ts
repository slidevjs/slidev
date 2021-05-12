import { isClient, useStorage, useToggle } from '@vueuse/core'
import { computed, watch } from 'vue'
import { configs } from '../env'

const _isDark = useStorage('slidev-color-schema', false)

export const isColorSchemaAuto = computed(() => configs.colorSchema === 'auto')
export const isDark = computed<boolean>({
  get() {
    return isColorSchemaAuto.value
      ? _isDark.value
      : configs.colorSchema === 'dark'
  },
  set(v) {
    if (isColorSchemaAuto.value)
      _isDark.value = v
  },
})
export const toggleDark = useToggle(isDark)

if (isClient) {
  watch(
    isDark,
    (v) => {
      const html = document.querySelector('html')!
      html.classList.toggle('dark', v)
      html.classList.toggle('light', !v)
    },
    { immediate: true },
  )
}
