import { Fn, not, and, whenever } from '@vueuse/core'
import { fullscreen, magicKeys, shortcutsEnabled, isInputing, toggleOverview } from '../state'
import { toggleDark } from './dark'
import { next, nextSlide, prev, prevSlide } from './nav'

const _shortcut = and(not(isInputing), shortcutsEnabled)

export function shortcut(key: string, fn: Fn) {
  return whenever(and(magicKeys[key], _shortcut), fn)
}

// global shortcuts
shortcut('space', next)
shortcut('right', next)
shortcut('left', prev)
shortcut('up', prevSlide)
shortcut('down', nextSlide)
shortcut('shift_left', prevSlide)
shortcut('shift_right', nextSlide)
shortcut('d', toggleDark)
shortcut('f', () => fullscreen.toggle())
shortcut('escape', toggleOverview)
shortcut('o', toggleOverview)
