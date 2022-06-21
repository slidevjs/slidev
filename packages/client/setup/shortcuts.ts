/* __imports__ */

import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { downloadPDF, go, goFirst, goLast, next, nextSlide, prev, prevSlide } from '../logic/nav'
import { toggleDark } from '../logic/dark'
import { showGotoDialog, showOverview, toggleOverview } from '../state'
import { drawingEnabled } from '../logic/drawings'

export default function setupShortcuts() {
  // @ts-expect-error injected in runtime
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg: NavOperations = {
    next,
    prev,
    nextSlide,
    prevSlide,
    go,
    goFirst,
    goLast,
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
