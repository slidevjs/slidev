import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import { useNav } from './useNav'

declare global {
  interface Window {
    __slidev_print__: {
      printState: Ref<'before' | 'slides' | 'after'>
      pageIndex: Ref<number>
      subIndex: ComputedRef<number>
      readonly slideNo: number
      next: () => Promise<boolean>
    }
  }
}

export function usePrintContext(lengthBefore = 0, lengthAfter = 0) {
  if (window.__slidev_print__)
    return window.__slidev_print__

  const { isPrintWithClicks, currentSlideNo, hasNextSlide, hasNext, nextSlide, next, goFirst } = useNav()

  goFirst()
  const pageIndex = ref(-1)
  const printState = ref<'before' | 'slides' | 'after'>('before')
  const endOfSlides = ref(-1)
  const subIndex = computed(() =>
    printState.value === 'before'
      ? pageIndex.value
      : printState.value === 'slides'
        ? pageIndex.value - lengthBefore
        : pageIndex.value - endOfSlides.value)

  const context = {
    printState,
    pageIndex,
    subIndex,
    get slideNo() {
      return printState.value === 'slides' ? currentSlideNo.value : -1
    },
    async next() {
      pageIndex.value++
      if (pageIndex.value === lengthBefore) {
        // First slide
        printState.value = 'slides'
      }
      else if (pageIndex.value > lengthBefore) {
        if (isPrintWithClicks.value ? hasNext.value : hasNextSlide.value) {
          // Next slide
          await (isPrintWithClicks.value ? next() : nextSlide())
        }
        else {
          if (endOfSlides.value === -1) {
            // First page after slides
            endOfSlides.value = pageIndex.value
            printState.value = 'after'
          }
          if (pageIndex.value === endOfSlides.value + lengthAfter) {
            // No more pages
            return false
          }
        }
      }
      return true
    },
  }
  window.__slidev_print__ = context
  return context
}
