import { useDark, useToggle } from '@vueuse/core'

export const isDark = useDark({
  valueDark: 'dark',
  valueLight: 'light',
})
export const toggleDark = useToggle(isDark)
