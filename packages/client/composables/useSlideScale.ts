import type { Ref } from 'vue'
import { computed } from 'vue'
import { useStyleTag } from '@vueuse/core'
import { slideAspect, slideHeight, slideWidth } from '../env'
import { slideScale } from '../state'
import { useNav } from './useNav'

export function useSlideScale(
  containerSize: { width: Ref<number>, height: Ref<number> },
  expectedWidth?: number,
  isMain: boolean = false,
) {
  const { isPrintMode } = useNav()

  const width = computed(() => expectedWidth ?? containerSize.width.value)
  const height = computed(() => expectedWidth ? expectedWidth / slideAspect.value : containerSize.height.value)

  const scale = computed(() => {
    if (slideScale.value && !isPrintMode.value)
      return +slideScale.value
    return Math.min(width.value / slideWidth.value, height.value / slideHeight.value)
  })

  const style = computed(() => ({
    'height': `${slideHeight.value}px`,
    'width': `${slideWidth.value}px`,
    'transform': `translate(-50%, -50%) scale(${scale.value})`,
    '--slidev-slide-scale': scale.value,
  }))

  if (isMain)
    useStyleTag(computed(() => `:root { --slidev-slide-scale: ${scale.value}; }`))

  return {
    scale,
    style,
  }
}
