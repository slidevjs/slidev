import { useElementBounding } from '@vueuse/core'
import { inject, ref, watch } from 'vue'
import { injectionSlideElement } from '../constants'
import { editorHeight, editorWidth, isEditorVertical, showEditor, slideScale, windowSize } from '../state'

export function useSlideBounds() {
  const slideElement = inject(injectionSlideElement, ref())
  const bounding = useElementBounding(slideElement)
  watch(
    [
      showEditor,
      isEditorVertical,
      editorWidth,
      editorHeight,
      slideScale,
      windowSize.width,
      windowSize.height,
    ],
    () => {
      setTimeout(bounding.update)
    },
    { flush: 'post' },
  )
  return bounding
}
