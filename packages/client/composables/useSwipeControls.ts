import type { Ref } from 'vue'
import { timestamp, usePointerSwipe } from '@vueuse/core'
import { ref } from 'vue'
import { useNav } from '../composables/useNav'
import { useDrawings } from './useDrawings'

export function useSwipeControls(root: Ref<HTMLElement | undefined>) {
  const { next, nextSlide, prev, prevSlide } = useNav()
  const { isDrawing } = useDrawings()

  const swipeBegin = ref(0)
  const { direction, distanceX, distanceY } = usePointerSwipe(root, {
    pointerTypes: ['touch'],
    onSwipeStart() {
      if (isDrawing.value)
        return
      swipeBegin.value = timestamp()
    },
    onSwipeEnd() {
      if (!swipeBegin.value)
        return
      if (isDrawing.value)
        return

      const x = Math.abs(distanceX.value)
      const y = Math.abs(distanceY.value)
      if (x / window.innerWidth > 0.3 || x > 75) {
        if (direction.value === 'left')
          next()

        else
          prev()
      }
      else if (y / window.innerHeight > 0.4 || y > 200) {
        if (direction.value === 'down')
          prevSlide()

        else
          nextSlide()
      }
    },
  })
}
