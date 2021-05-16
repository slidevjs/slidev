import { Fn, not, and, whenever } from '@vueuse/core'
import { fullscreen, magicKeys, shortcutsEnabled, isInputing, toggleOverview, showGotoDialog, showOverview, isOnFocus } from '../state'
import { toggleDark } from './dark'
import { next, nextSlide, prev, prevSlide } from './nav'

const _shortcut = and(not(isInputing), not(isOnFocus), shortcutsEnabled)

export function shortcut(key: string, fn: Fn, autoRepeat: boolean = false) {
  let count = 0;
  const f = () => {
    if (autoRepeat && magicKeys.current.has(key)) {
      setTimeout(() => f(), Math.max(1000 - count * 40, 200))
      count++
    }
    else {
      count = 0
    }
    fn()
  }
  if (!autoRepeat)
    return whenever(and(magicKeys[key], _shortcut), f, { flush: 'sync' })
}

export function registerShotcuts() {
  // global shortcuts
  shortcut('space', next, true)
  shortcut('right', next, true)
  shortcut('left', prev, true)
  shortcut('up', () => prevSlide(false), true)
  shortcut('down', nextSlide, true)
  shortcut('shift_left', () => prevSlide(false), true)
  shortcut('shift_right', nextSlide, true)
  shortcut('d', toggleDark)
  shortcut('f', () => fullscreen.toggle())
  shortcut('o', toggleOverview)
  shortcut('escape', () => showOverview.value = false)
  shortcut('g', () => showGotoDialog.value = !showGotoDialog.value)
}
