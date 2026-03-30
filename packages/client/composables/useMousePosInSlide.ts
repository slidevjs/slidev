import { useMouse } from '@vueuse/core'
import { computed } from 'vue'

export function useMousePosInSlide() {
  const mouse = useMouse()

  return computed(() => {
    const rect = document.querySelector('#slide-content')?.getBoundingClientRect()
    if (!rect)
      return undefined

    const x = (mouse.x.value - rect.left) / rect.width * 100
    const y = (mouse.y.value - rect.top) / rect.height * 100

    if (x < 0 || x > 100 || y < 0 || y > 100)
      return undefined

    return { x, y }
  })
}
