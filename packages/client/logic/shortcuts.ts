import { Fn, not, and, whenever } from '@vueuse/core'
import { fullscreen, magicKeys, shortcutsEnabled, isInputing, toggleOverview, showGotoDialog, showOverview, isOnFocus } from '../state'
import { toggleDark } from './dark'
import { next, nextSlide, prev, prevSlide } from './nav'

const _shortcut = and(not(isInputing), not(isOnFocus), shortcutsEnabled)

export function shortcut(key: string, fn: Fn) {
  return whenever(and(magicKeys[key], _shortcut), fn, { flush: 'sync' })
}

export function registerShotcuts() {
  // global shortcuts
  shortcut('space', next)
  shortcut('right', next)
  shortcut('left', prev)
  shortcut('up', () => prevSlide(false))
  shortcut('down', nextSlide)
  shortcut('shift_left', () => prevSlide(false))
  shortcut('shift_right', nextSlide)
  shortcut('d', toggleDark)
  shortcut('f', () => fullscreen.toggle())
  shortcut('o', toggleOverview)
  shortcut('escape', () => showOverview.value = false)
  shortcut('g', () => showGotoDialog.value = !showGotoDialog.value)
}
