import { useElementBounding } from '@vueuse/core'
import { inject, ref, watch } from 'vue'
import { injectionSlideElement } from '../constants'
import { editorHeight, editorWidth, isEditorVertical, slideScale } from '../state'

export function useSlideBounds() {
  const slideElement = inject(injectionSlideElement, ref())
  const bounding = useElementBounding(slideElement)
  watch(
    [
      isEditorVertical,
      editorWidth,
      editorHeight,
      slideScale,
    ],
    bounding.update,
    { flush: 'post' },
  )
  return bounding
}
