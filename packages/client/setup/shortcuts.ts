import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { and, not, or } from '@vueuse/math'
import setups from '#slidev/setups/shortcuts'
import { useDrawings } from '../composables/useDrawings'
import { useNav } from '../composables/useNav'
import { canDrivePresenter } from '../composables/usePresenterDriver'
import { toggleDark } from '../logic/dark'
import { activeDragElement, magicKeys, showGotoDialog, showOverview, toggleOverview } from '../state'
import { downloadPDF } from '../utils'
import { currentOverviewPage, downOverviewPage, nextOverviewPage, prevOverviewPage, upOverviewPage } from './../logic/overview'

export default function setupShortcuts() {
  const { go, goFirst, goLast, isPresenter, next, nextSlide, prev, prevSlide } = useNav()
  const { drawingEnabled } = useDrawings()
  const { escape, space, shift, left, right, up, down, enter, d, g, o, '`': backtick } = magicKeys

  function withPresenterDriver<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>) => {
      if (isPresenter.value && !canDrivePresenter())
        return
      return fn(...args)
    }) as T
  }

  const guardedGo = withPresenterDriver(go)
  const guardedGoFirst = withPresenterDriver(goFirst)
  const guardedGoLast = withPresenterDriver(goLast)
  const guardedNext = withPresenterDriver(next)
  const guardedNextSlide = withPresenterDriver(nextSlide)
  const guardedPrev = withPresenterDriver(prev)
  const guardedPrevSlide = withPresenterDriver(prevSlide)

  const context: NavOperations = {
    next: guardedNext,
    prev: guardedPrev,
    nextSlide: guardedNextSlide,
    prevSlide: guardedPrevSlide,
    go: guardedGo,
    goFirst: guardedGoFirst,
    goLast: guardedGoLast,
    downloadPDF,
    toggleDark,
    toggleOverview,
    toggleDrawing: () => drawingEnabled.value = !drawingEnabled.value,
    escapeOverview: () => showOverview.value = false,
    showGotoDialog: () => showGotoDialog.value = !showGotoDialog.value,
  }

  const navViaArrowKeys = and(not(showOverview), not(activeDragElement))

  let shortcuts: ShortcutOptions[] = [
    { name: 'next_space', key: and(space, not(shift)), fn: guardedNext, autoRepeat: true },
    { name: 'prev_space', key: and(space, shift), fn: guardedPrev, autoRepeat: true },
    { name: 'next_right', key: and(right, not(shift), navViaArrowKeys), fn: guardedNext, autoRepeat: true },
    { name: 'prev_left', key: and(left, not(shift), navViaArrowKeys), fn: guardedPrev, autoRepeat: true },
    { name: 'next_page_key', key: 'pageDown', fn: guardedNext, autoRepeat: true },
    { name: 'prev_page_key', key: 'pageUp', fn: guardedPrev, autoRepeat: true },
    { name: 'next_down', key: and(down, navViaArrowKeys), fn: guardedNextSlide, autoRepeat: true },
    { name: 'prev_up', key: and(up, navViaArrowKeys), fn: guardedPrevSlide, autoRepeat: true },
    { name: 'next_shift', key: and(right, shift), fn: guardedNextSlide, autoRepeat: true },
    { name: 'prev_shift', key: and(left, shift), fn: guardedPrevSlide, autoRepeat: true },
    { name: 'toggle_dark', key: and(d, not(drawingEnabled)), fn: toggleDark },
    { name: 'toggle_overview', key: and(or(o, backtick), not(drawingEnabled)), fn: toggleOverview },
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
        guardedGo(currentOverviewPage.value)
        showOverview.value = false
      },
    },
  ]

  const baseShortcutNames = new Set(shortcuts.map(s => s.name))

  for (const setup of setups) {
    shortcuts = setup(context, shortcuts)
  }

  const remainingBaseShortcutNames = shortcuts.filter(s => s.name && baseShortcutNames.has(s.name))
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

  return shortcuts
}
