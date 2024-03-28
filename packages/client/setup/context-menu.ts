/// <reference types="unplugin-icons/types/vue3" />

import { computed } from 'vue'
import type { ContextMenuItem } from '@slidev/types'
import { useNav } from '../composables/useNav'
import { useDrawings } from '../composables/useDrawings'
import { toggleOverview } from '../state'
import setups from '#slidev/setups/context-menu'

import IconArrowLeft from '~icons/carbon/arrow-left'
import IconArrowRight from '~icons/carbon/arrow-right'
import IconArrowUp from '~icons/carbon/arrow-up'
import IconArrowDown from '~icons/carbon/arrow-down'
import IconPen from '~icons/carbon/pen'
import IconApps from '~icons/carbon/apps'

export default () => {
  const { next, nextSlide, prev, prevSlide, hasNext, hasPrev, currentPage, total } = useNav()
  const { drawingEnabled } = useDrawings()
  return setups.reduce(
    (items, fn) => fn(items),
    computed(() => [
      {
        small: true,
        icon: IconArrowLeft,
        label: 'Previous Click',
        action: prev,
        disabled: !hasPrev.value,
      },
      {
        small: true,
        icon: IconArrowRight,
        label: 'Next Click',
        action: next,
        disabled: !hasNext.value,
      },
      {
        small: true,
        icon: IconArrowUp,
        label: 'Previous Slide',
        action: prevSlide,
        disabled: currentPage.value <= 1,
      },
      {
        small: true,
        icon: IconArrowDown,
        label: 'Next Slide',
        action: nextSlide,
        disabled: currentPage.value >= total.value,
      },
      'separator',
      {
        icon: IconPen,
        label: drawingEnabled.value ? 'Hide drawing toolbar' : 'Show drawing toolbar',
        action: () => (drawingEnabled.value = !drawingEnabled.value),
      },
      {
        icon: IconApps,
        label: 'Show slide overview',
        action: toggleOverview,
      },
    ] as ContextMenuItem[]),
  )
}
