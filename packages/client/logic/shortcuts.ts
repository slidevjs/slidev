import type { Fn, KeyFilter } from '@vueuse/core'
import { onKeyStroke } from '@vueuse/core'
import { and, not } from '@vueuse/math'
import type { Ref } from 'vue'
import { watch } from 'vue'
import type { ShortcutOptions } from '@slidev/types'
import { fullscreen, isInputting, isOnFocus, magicKeys, shortcutsEnabled } from '../state'
import setupShortcuts from '../setup/shortcuts'

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
  const allShortcuts = setupShortcuts()

  const shortcuts = new Map<string | Ref<Boolean>, ShortcutOptions>(
    allShortcuts.map((options: ShortcutOptions) => [options.key, options]),
  )

  shortcuts.forEach((options) => {
    if (options.fn)
      shortcut(options.key, options.fn, options.autoRepeat)
  })

  strokeShortcut('f', () => fullscreen.toggle())
}
