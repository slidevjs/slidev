import type { Fn, KeyFilter } from '@vueuse/core'
import { and, not, onKeyStroke } from '@vueuse/core'
import type { Ref } from 'vue'
import { watch } from 'vue'
import type { ShortcutOptions } from '@slidev/types'
import { fullscreen, isInputting, isOnFocus, magicKeys, shortcutsEnabled, showGotoDialog, showOverview, toggleOverview } from '../state'
import setupShortcuts from '../setup/shortcuts'
import { toggleDark } from './dark'
import { go, next, nextSlide, prev, prevSlide } from './nav'
import { drawingEnabled } from './drawings'
import { currentOverviewPage, nextOverviewPage, prevOverviewPage } from './overview'

const _shortcut = and(not(isInputting), not(isOnFocus), shortcutsEnabled)

export function shortcut(key: string | Ref<boolean>, fn: Fn, autoRepeat = false) {
  if (typeof key === 'string')
    key = magicKeys[key]

  const source = and(key, _shortcut)
  let count = 0
  let timer: any
  const trigger = () => {
    clearTimeout(timer)
    if (!source.value) {
      count = 0
      return
    }
    if (autoRepeat) {
      timer = setTimeout(trigger, Math.max(1000 - count * 250, 150))
      count++
    }
    fn()
  }

  return watch(source, trigger, { flush: 'sync' })
}

export function strokeShortcut(key: KeyFilter, fn: Fn) {
  return onKeyStroke(key, (ev) => {
    if (!_shortcut.value)
      return
    if (!ev.repeat)
      fn()
  })
}

export function registerShortcuts() {
  const customShortcuts = setupShortcuts()

  const { escape, space, shift, left, right, enter, d, g, o } = magicKeys
  const shortcuts = new Map<string | Ref<Boolean>, ShortcutOptions>(
    [
      { key: and(space, not(shift)), fn: next, autoRepeat: true },
      { key: and(space, shift), fn: prev, autoRepeat: true },
      { key: and(right, not(shift), not(showOverview)), fn: next, autoRepeat: true },
      { key: and(left, not(shift), not(showOverview)), fn: prev, autoRepeat: true },
      { key: 'pageDown', fn: next, autoRepeat: true },
      { key: 'pageUp', fn: prev, autoRepeat: true },
      { key: 'up', fn: () => prevSlide(false), autoRepeat: true },
      { key: 'down', fn: nextSlide, autoRepeat: true },
      { key: and(left, shift), fn: () => prevSlide(false), autoRepeat: true },
      { key: and(right, shift), fn: nextSlide, autoRepeat: true },
      { key: and(d, not(drawingEnabled)), fn: toggleDark },
      { key: and(o, not(drawingEnabled)), fn: toggleOverview },
      { key: and(escape, not(drawingEnabled)), fn: () => showOverview.value = false },
      { key: and(g, not(drawingEnabled)), fn: () => showGotoDialog.value = !showGotoDialog.value },
      { key: and(left, showOverview), fn: prevOverviewPage },
      { key: and(right, showOverview), fn: nextOverviewPage },
      { key: and(enter, showOverview), fn: () => { go(currentOverviewPage.value); showOverview.value = false } },
      ...customShortcuts,
    ]
      .map((options: ShortcutOptions) => [options.key, options]),
  )

  shortcuts.forEach((options) => {
    if (options.fn)
      shortcut(options.key, options.fn, options.autoRepeat)
  })

  strokeShortcut('f', () => fullscreen.toggle())
}
