/* __imports__ */
import { and, not } from '@vueuse/math'
import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { downloadPDF, go, goFirst, goLast, next, nextSlide, prev, prevSlide } from '../logic/nav'
import { toggleDark } from '../logic/dark'
import { magicKeys, showGotoDialog, showOverview, toggleOverview } from '../state'
import { drawingEnabled } from '../logic/drawings'
import { currentOverviewPage, downOverviewPage, nextOverviewPage, prevOverviewPage, upOverviewPage } from './../logic/overview'

export default function setupShortcuts() {
  const { escape, space, shift, left, right, up, down, enter, d, g, o } = magicKeys

  // @ts-expect-error injected in runtime
  // eslint-disable-next-line unused-imports/no-unused-vars
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
  let injection_return: ShortcutOptions[] = [
    { name: 'next_space', key: and(space, not(shift)), fn: next, autoRepeat: true },
    { name: 'prev_space', key: and(space, shift), fn: prev, autoRepeat: true },
    { name: 'next_right', key: and(right, not(shift), not(showOverview)), fn: next, autoRepeat: true },
    { name: 'prev_left', key: and(left, not(shift), not(showOverview)), fn: prev, autoRepeat: true },
    { name: 'next_page_key', key: 'pageDown', fn: next, autoRepeat: true },
    { name: 'prev_page_key', key: 'pageUp', fn: prev, autoRepeat: true },
    { name: 'next_down', key: and(down, not(showOverview)), fn: nextSlide, autoRepeat: true },
    { name: 'prev_up', key: and(up, not(showOverview)), fn: () => prevSlide(false), autoRepeat: true },
    { name: 'next_shift', key: and(right, shift), fn: nextSlide, autoRepeat: true },
    { name: 'prev_shift', key: and(left, shift), fn: () => prevSlide(false), autoRepeat: true },
    { name: 'toggle_dark', key: and(d, not(drawingEnabled)), fn: toggleDark },
    { name: 'toggle_overview', key: and(o, not(drawingEnabled)), fn: toggleOverview },
    { name: 'hide_overview', key: and(escape, not(drawingEnabled)), fn: () => showOverview.value = false },
    { name: 'goto', key: and(g, not(drawingEnabled)), fn: () => showGotoDialog.value = !showGotoDialog.value },
    { name: 'next_overview', key: and(right, showOverview), fn: nextOverviewPage },
    { name: 'prev_overview', key: and(left, showOverview), fn: prevOverviewPage },
    { name: 'up_overview', key: and(up, showOverview), fn: upOverviewPage },
    { name: 'down_overview', key: and(down, showOverview), fn: downOverviewPage },
    {
      name: 'goto_from_overview',
      key: and(enter, showOverview),
      fn: () => {
        go(currentOverviewPage.value)
        showOverview.value = false
      },
    },
  ]

  const baseShortcutNames = new Set(injection_return.map(s => s.name))

  /* __chained_injections__ */

  const remainingBaseShortcutNames = injection_return.filter(s => s.name && baseShortcutNames.has(s.name))
  if (remainingBaseShortcutNames.length === 0) {
    const message = [
      '========== WARNING ==========',
      'defineShortcutsSetup did not return any of the base shortcuts.',
      'See https://sli.dev/custom/config-shortcuts.html for migration.',
      'If it is intentional, return at least one shortcut with one of the base names (e.g. name:"goto").',
    ].join('\n\n')
    // eslint-disable-next-line no-alert
    alert(message)

    console.warn(message)
  }

  return injection_return
}
