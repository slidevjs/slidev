import type { ShortcutOptions } from '@slidev/types'
import type { Fn, KeyFilter } from '@vueuse/core'
import type { Ref } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { and, not } from '@vueuse/math'
import { watch } from 'vue'
import { useNav } from '../composables/useNav'
import setupShortcuts from '../setup/shortcuts'
import { fullscreen, isInputting, isOnFocus, magicKeys, shortcutsEnabled, shortcutsLocked } from '../state'

export function registerShortcuts() {
  const { isPrintMode } = useNav()
  const enabled = and(not(isInputting), not(isOnFocus), not(isPrintMode), shortcutsEnabled, not(shortcutsLocked))

  const allShortcuts = setupShortcuts()
  const shortcuts = new Map<string | Ref<boolean>, ShortcutOptions>(
    allShortcuts.map((options: ShortcutOptions) => [options.key, options]),
  )

  shortcuts.forEach((options) => {
    if (options.fn)
      shortcut(options.key, options.fn, options.autoRepeat)
  })

  strokeShortcut('f', () => fullscreen.toggle())

  function shortcut(key: string | Ref<boolean>, fn: Fn, autoRepeat = false) {
    if (typeof key === 'string')
      key = magicKeys[key]

    const source = and(key, enabled)
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

  function strokeShortcut(key: KeyFilter, fn: Fn) {
    return onKeyStroke(key, (ev) => {
      if (!enabled.value)
        return
      if (!ev.repeat)
        fn()
    })
  }
}
