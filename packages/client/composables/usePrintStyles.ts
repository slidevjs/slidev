import { useStyleTag } from '@vueuse/core'
import { computed } from 'vue'
import { slideHeight, slideWidth } from '../env'
import { useNav } from './useNav'

export function usePrintStyles() {
  const { isPrintMode } = useNav()

  useStyleTag(computed(() => isPrintMode.value
    ? `
@page {
  size: ${slideWidth.value}px ${slideHeight.value}px;
  margin: 0px;
}

* {
  transition: none !important;
  transition-duration: 0s !important;
}

`
    : ''))
}
