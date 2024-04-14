import { useStyleTag } from '@vueuse/core'
import { slideHeight, slideWidth } from '../env'

export function usePrintStyle() {
  return useStyleTag(`
    @page {
      size: ${slideWidth}px ${slideHeight}px;
      margin: 0;
    }
  `)
}
