import { useElementBounding } from '@vueuse/core'
import { inject, ref, watch } from 'vue'
import { injectionSlideElement } from '../constants'
import { editorHeight, editorWidth, isEditorVertical, showEditor, slideScale, windowSize } from '../state'

export function useSlideBounds(slideElement = inject(injectionSlideElement, ref())) {
  const bounding = useElementBounding(slideElement)
  const stop = watch(
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
      setTimeout(bounding.update, 300)
    },
    {
      flush: 'post',
      immediate: true,
    },
  )
  return {
    ...bounding,
    stop,
  }
}
