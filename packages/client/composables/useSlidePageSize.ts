import { useStyleTag } from '@vueuse/core'
import { slideHeight, slideWidth } from '../env'

export function useSlidePageSize() {
  return useStyleTag(`
    @page {
      size: ${slideWidth.value}px ${slideHeight.value}px;
      margin: 0;
    }
  `)
}
