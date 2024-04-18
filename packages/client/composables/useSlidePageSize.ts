import { useStyleTag } from '@vueuse/core'
import { slideHeight, slideWidth } from '../env'

export function useSlidePageSize() {
  return useStyleTag(`
    @page {
      size: ${slideWidth}px ${slideHeight}px;
      margin: 0;
    }
  `)
}
