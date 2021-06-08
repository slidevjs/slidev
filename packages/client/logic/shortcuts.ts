import { Fn, not, and, onKeyStroke, KeyFilter } from '@vueuse/core'
import { watch } from 'vue'
import type { ShortcutOptions } from '@slidev/types'
import { fullscreen, magicKeys, shortcutsEnabled, isInputting, toggleOverview, showGotoDialog, showOverview, isOnFocus } from '../state'
import setupShortcuts from '../setup/shortcuts'
import { toggleDark } from './dark'
import { next, nextSlide, prev, prevSlide } from './nav'

const _shortcut = and(not(isInputting), not(isOnFocus), shortcutsEnabled)

export function shortcut(key: string, fn: Fn, autoRepeat = false) {
  const source = and(magicKeys[key], _shortcut)
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
    if (!ev.repeat)
      fn()
  })
}

export function registerShortcuts() {
  const customShortcuts = setupShortcuts()

  const shortcuts = new Map<string, ShortcutOptions>(
    [
      { key: 'space', fn: next, autoRepeat: true },
      { key: 'right', fn: next, autoRepeat: true },
      { key: 'left', fn: prev, autoRepeat: true },
      { key: 'pageDown', fn: next, autoRepeat: true },
      { key: 'pageUp', fn: prev, autoRepeat: true },
      { key: 'up', fn: () => prevSlide(false), autoRepeat: true },
      { key: 'down', fn: nextSlide, autoRepeat: true },
      { key: 'shift_left', fn: () => prevSlide(false), autoRepeat: true },
      { key: 'shift_right', fn: nextSlide, autoRepeat: true },
      { key: 'd', fn: toggleDark },
      { key: 'o', fn: toggleOverview },
      { key: 'escape', fn: () => showOverview.value = false },
      { key: 'g', fn: () => showGotoDialog.value = !showGotoDialog.value },
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
