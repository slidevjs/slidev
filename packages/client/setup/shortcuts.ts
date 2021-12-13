/* __imports__ */

import type { ShortcutOptions, NavOperations } from '@slidev/types'
import { next, prev, nextSlide, prevSlide, downloadPDF } from '../logic/nav'
import { toggleDark } from '../logic/dark'
import { toggleOverview, showGotoDialog, showOverview } from '../state'
import { drawingEnabled } from '../logic/drawings'

export default function setupShortcuts() {
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg: NavOperations = {
    next,
    prev,
    nextSlide,
    prevSlide,
    downloadPDF,
    toggleDark,
    toggleOverview,
    toggleDrawing: () => drawingEnabled.value = !drawingEnabled.value,
    escapeOverview: () => showOverview.value = false,
    showGotoDialog: () => showGotoDialog.value = !showGotoDialog.value,
  }

  // eslint-disable-next-line prefer-const
  let injection_return: Array<ShortcutOptions> = []

  /* __injections__ */

  return injection_return
}
