import { isClient, useLocalStorage, usePreferredDark, useToggle } from '@vueuse/core'
import { computed, watch } from 'vue'
import { configs } from '../env'

const preferredDark = usePreferredDark()
const store = useLocalStorage('slidev-color-schema', 'auto')

export const isColorSchemaConfigured = computed(() => configs.colorSchema !== 'auto')
export const isDark = computed<boolean>({
  get() {
    if (isColorSchemaConfigured.value)
      return configs.colorSchema === 'dark'
    return store.value === 'auto'
      ? preferredDark.value
      : store.value === 'dark'
  },
  set(v) {
    if (isColorSchemaConfigured.value)
      return
    store.value = v === preferredDark.value
      ? 'auto'
      : v ? 'dark' : 'light'
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
