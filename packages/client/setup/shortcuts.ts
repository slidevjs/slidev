/* __imports__ */
import { and, not } from '@vueuse/core'
import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { downloadPDF, go, goFirst, goLast, next, nextSlide, prev, prevSlide } from '../logic/nav'
import { toggleDark } from '../logic/dark'
import { magicKeys, showGotoDialog, showOverview, toggleOverview } from '../state'
import { drawingEnabled } from '../logic/drawings'
import { currentOverviewPage, downOverviewPage, nextOverviewPage, prevOverviewPage, upOverviewPage } from './../logic/overview'

export default function setupShortcuts() {
  const { escape, space, shift, left, right, up, down, enter, d, g, o } = magicKeys

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

  const injection_arg_2: ShortcutOptions[] = [
    { key: and(space, not(shift)), fn: next, autoRepeat: true },
    { key: and(space, shift), fn: prev, autoRepeat: true },
    { key: and(right, not(shift), not(showOverview)), fn: next, autoRepeat: true },
    { key: and(left, not(shift), not(showOverview)), fn: prev, autoRepeat: true },
    { key: 'pageDown', fn: next, autoRepeat: true },
    { key: 'pageUp', fn: prev, autoRepeat: true },
    { key: and(up, not(showOverview)), fn: () => prevSlide(false), autoRepeat: true },
    { key: and(down, not(showOverview)), fn: nextSlide, autoRepeat: true },
    { key: and(left, shift), fn: () => prevSlide(false), autoRepeat: true },
    { key: and(right, shift), fn: nextSlide, autoRepeat: true },
    { key: and(d, not(drawingEnabled)), fn: toggleDark },
    { key: and(o, not(drawingEnabled)), fn: toggleOverview },
    { key: and(escape, not(drawingEnabled)), fn: () => showOverview.value = false },
    { key: and(g, not(drawingEnabled)), fn: () => showGotoDialog.value = !showGotoDialog.value },
    { key: and(left, showOverview), fn: prevOverviewPage },
    { key: and(right, showOverview), fn: nextOverviewPage },
    { key: and(up, showOverview), fn: upOverviewPage },
    { key: and(down, showOverview), fn: downOverviewPage },
    { key: and(enter, showOverview), fn: () => { go(currentOverviewPage.value); showOverview.value = false } },
  ]

  // eslint-disable-next-line prefer-const
  let injection_return: Array<ShortcutOptions> = []

  /* __injections__ */

  return { customShortcuts: injection_return, defaultShortcuts: injection_arg_2 }
}
