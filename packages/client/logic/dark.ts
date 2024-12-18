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
  const CSS_DISABLE_TRANS = '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'

  watch(
    isDark,
    (v) => {
      const style = window!.document.createElement('style')
      style.appendChild(document.createTextNode(CSS_DISABLE_TRANS))
      window!.document.head.appendChild(style)

      const html = document.querySelector('html')!
      html.classList.toggle('dark', v)
      html.classList.toggle('light', !v)

      // Calling getComputedStyle forces the browser to redraw
      // @ts-expect-error unused variable
      const _ = window!.getComputedStyle(style!).opacity
      document.head.removeChild(style!)
    },
    { immediate: true },
  )
}
