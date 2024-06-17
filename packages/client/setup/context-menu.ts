/// <reference types="unplugin-icons/types/vue3" />
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { ContextMenuItem } from '@slidev/types'
import { useNav } from '../composables/useNav'
import { useDrawings } from '../composables/useDrawings'
import { fullscreen, showEditor, toggleOverview } from '../state'
import { useFeatures } from '../composables/useFeatures'
import setups from '#slidev/setups/context-menu'

import IconArrowLeft from '~icons/carbon/arrow-left'
import IconArrowRight from '~icons/carbon/arrow-right'
import IconArrowUp from '~icons/carbon/arrow-up'
import IconArrowDown from '~icons/carbon/arrow-down'
import IconPen from '~icons/carbon/pen'
import IconTextNotationToggle from '~icons/carbon/text-annotation-toggle'
import IconApps from '~icons/carbon/apps'
import IconPresentationFile from '~icons/carbon/presentation-file'
import IconUserSpeaker from '~icons/carbon/user-speaker'
import IconMaximize from '~icons/carbon/maximize'
import IconMinimize from '~icons/carbon/minimize'

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
  } = useNav()
  const { drawingEnabled } = useDrawings()
  const features = useFeatures()
  const {
    isFullscreen,
    toggle: toggleFullscreen,
  } = fullscreen

  return items = setups.reduce(
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
      __SLIDEV_FEATURE_EDITOR__ && features.allowToEdit && {
        icon: IconTextNotationToggle,
        label: showEditor.value ? 'Hide editor' : 'Show editor',
        action: () => (showEditor.value = !showEditor.value),
      },
      __SLIDEV_FEATURE_DRAWINGS__ && (features.allowToDraw || drawingEnabled.value) && {
        icon: IconPen,
        label: drawingEnabled.value ? 'Hide drawing toolbar' : 'Show drawing toolbar',
        action: () => (drawingEnabled.value = !drawingEnabled.value),
      },
      {
        icon: IconApps,
        label: 'Show slide overview',
        action: toggleOverview,
      },
      __SLIDEV_FEATURE_PRESENTER__ && isPresenter.value && {
        icon: IconPresentationFile,
        label: 'Exit Presenter Mode',
        action: exitPresenter,
      },
      __SLIDEV_FEATURE_PRESENTER__ && features.enterPresenter && {
        icon: IconUserSpeaker,
        label: 'Enter Presenter Mode',
        action: enterPresenter,
      },
      {
        icon: isFullscreen.value ? IconMinimize : IconMaximize,
        label: isFullscreen.value ? 'Close fullscreen' : 'Enter fullscreen',
        action: toggleFullscreen,
      },
    ].filter(Boolean) as ContextMenuItem[]),
  )
}
