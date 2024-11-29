/// <reference types="unplugin-icons/types/vue3" />

import type { ContextMenuItem } from '@slidev/types'
import type { ComputedRef } from 'vue'
import setups from '#slidev/setups/context-menu'
import { computed } from 'vue'
import { useDrawings } from '../composables/useDrawings'
import { useNav } from '../composables/useNav'
import { fullscreen, showEditor, toggleOverview } from '../state'

// @unocss-include

let items: ComputedRef<ContextMenuItem[]> | undefined

export default () => {
  if (items)
    return items

  const {
    next,
    nextSlide,
    prev,
    prevSlide,
    hasNext,
    hasPrev,
    currentPage,
    total,
    isPresenter,
    enterPresenter,
    exitPresenter,
    isEmbedded,
    isPresenterAvailable,
  } = useNav()
  const { drawingEnabled } = useDrawings()
  const {
    isFullscreen,
    toggle: toggleFullscreen,
  } = fullscreen

  return items = setups.reduce(
    (items, fn) => fn(items),
    computed(() => [
      {
        small: true,
        icon: 'i-carbon:arrow-left',
        label: 'Previous Click',
        action: prev,
        disabled: !hasPrev.value,
      },
      {
        small: true,
        icon: 'i-carbon:arrow-right',
        label: 'Next Click',
        action: next,
        disabled: !hasNext.value,
      },
      {
        small: true,
        icon: 'i-carbon:arrow-up',
        label: 'Previous Slide',
        action: prevSlide,
        disabled: currentPage.value <= 1,
      },
      {
        small: true,
        icon: 'i-carbon:arrow-down',
        label: 'Next Slide',
        action: nextSlide,
        disabled: currentPage.value >= total.value,
      },
      'separator',
      {
        icon: 'i-carbon:text-annotation-toggle', // IconTextNotationToggle,
        label: showEditor.value ? 'Hide editor' : 'Show editor',
        action: () => (showEditor.value = !showEditor.value),
      },
      {
        icon: 'i-carbon:pen',
        label: drawingEnabled.value ? 'Hide drawing toolbar' : 'Show drawing toolbar',
        action: () => (drawingEnabled.value = !drawingEnabled.value),
      },
      {
        icon: 'i-carbon:apps',
        label: 'Show slide overview',
        action: toggleOverview,
      },
      isPresenter.value && {
        icon: 'i-carbon:presentation-file',
        label: 'Exit Presenter Mode',
        action: exitPresenter,
      },
      __SLIDEV_FEATURE_PRESENTER__ && isPresenterAvailable.value && {
        icon: 'i-carbon:user-speaker',
        label: 'Enter Presenter Mode',
        action: enterPresenter,
      },
      !isEmbedded.value && {
        icon: isFullscreen.value ? 'i-carbon:minimize' : 'i-carbon:maximize',
        label: isFullscreen.value ? 'Close fullscreen' : 'Enter fullscreen',
        action: toggleFullscreen,
      },
    ].filter(Boolean) as ContextMenuItem[]),
  )
}
