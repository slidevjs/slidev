import type { App, DirectiveBinding, InjectionKey } from 'vue'
import { watch } from 'vue'
import { remove } from '@antfu/utils'
import { isClicksDisabled } from '../logic/nav'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
  injectionClicks,
  injectionClicksDisabled,
  injectionClicksElements,
  injectionOrderMap,
} from '../constants'

function dirInject<T = unknown>(dir: DirectiveBinding<any>, key: InjectionKey<T> | string, defaultValue?: T): T | undefined {
  return (dir.instance?.$ as any).provides[key as any] ?? defaultValue
}

export default function createDirectives() {
  return {
    install(app: App) {
      app.directive('click', {
        // @ts-expect-error extra prop
        name: 'v-click',

        mounted(el: HTMLElement, dir) {
          if (isClicksDisabled.value || dirInject(dir, injectionClicksDisabled)?.value)
            return

          const elements = dirInject(dir, injectionClicksElements)
          const clicks = dirInject(dir, injectionClicks)
          const orderMap = dirInject(dir, injectionOrderMap)

          const hide = dir.modifiers.hide !== false && dir.modifiers.hide != null
          const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

          const prev = elements?.value?.length || 0

          const CLASS_HIDE = fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN

          if (elements && !elements?.value?.includes(el))
            elements.value.push(el)

          // Set default dir.value
          if (dir.value == null)
            dir.value = elements?.value?.length
          // Relative value starts with '+' o '-'
          if (typeof dir.value === 'string' && (dir.value.startsWith('+') || dir.value.startsWith('-')))
            dir.value = (elements?.value?.length || 0) + Number(dir.value)

          // If orderMap didn't have dir.value aka the order key, then initialize it.
          // If key exists, then move current element to the first of order array to
          // make sure the v-after set correct CLASS_VCLICK_CURRENT state.
          if (!orderMap?.value.has(dir.value)) {
            orderMap?.value.set(dir.value, [el])
          }
          else {
            if (!orderMap?.value.get(dir.value)?.includes(el)) {
              const afterClicks = orderMap?.value.get(dir.value) || []
              orderMap?.value.set(dir.value, [el].concat(afterClicks))
            }
          }

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          if (clicks) {
            watch(
              clicks,
              () => {
                const c = clicks?.value ?? 0
                const show = dir.value != null
                  ? c >= dir.value
                  : c > prev

                if (!el.classList.contains(CLASS_VCLICK_HIDDEN_EXP))
                  el.classList.toggle(CLASS_HIDE, !show)

                if (hide !== false && hide !== undefined)
                  el.classList.toggle(CLASS_HIDE, show)

                // Reset CLASS_VCLICK_CURRENT to false.
                el.classList.toggle(CLASS_VCLICK_CURRENT, false)

                const currentElArray = orderMap?.value.get(c)
                currentElArray?.forEach((cEl, idx) => {
                  // Reset CLASS_VCLICK_PRIOR to false
                  cEl.classList.toggle(CLASS_VCLICK_PRIOR, false)
                  // If the element is the last of order array, then set it as
                  // CLASS_VCLICK_CURRENT state, others set as CLASS_VCLICK_PRIOR state.
                  if (idx === currentElArray.length - 1)
                    cEl.classList.toggle(CLASS_VCLICK_CURRENT, true)
                  else
                    cEl.classList.toggle(CLASS_VCLICK_PRIOR, true)
                })

                if (!el.classList.contains(CLASS_VCLICK_CURRENT))
                  el.classList.toggle(CLASS_VCLICK_PRIOR, show)
              },
              { immediate: true },
            )
          }
        },
        unmounted(el: HTMLElement, dir) {
          el?.classList.toggle(CLASS_VCLICK_TARGET, false)
          const elements = dirInject(dir, injectionClicksElements)!
          if (elements?.value)
            remove(elements.value, el)
        },
      })

      app.directive('after', {
        // @ts-expect-error extra prop
        name: 'v-after',

        mounted(el: HTMLElement, dir) {
          if (isClicksDisabled.value || dirInject(dir, injectionClicksDisabled)?.value)
            return

          const elements = dirInject(dir, injectionClicksElements)
          const clicks = dirInject(dir, injectionClicks)
          const orderMap = dirInject(dir, injectionOrderMap)

          const prev = elements?.value.length

          // Set default dir.value
          if (dir.value == null)
            dir.value = elements?.value.length
          // Relative value starts with '+' o '-'
          if (typeof dir.value === 'string' && (dir.value.startsWith('+') || dir.value.startsWith('-')))
            dir.value = (elements?.value?.length || 0) + Number(dir.value)

          // If a v-click order before v-after is lower than v-after, the order map will
          // not contain the key for v-after, so we need to set it first, then move v-after
          // to the last of order array.
          if (orderMap?.value.has(dir.value))
            orderMap?.value.get(dir.value)?.push(el)
          else
            orderMap?.value.set(dir.value, [el])

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          if (clicks) {
            watch(
              clicks,
              () => {
                const show = (clicks.value ?? 0) >= (dir.value ?? prev ?? 0)
                if (!el.classList.contains(CLASS_VCLICK_HIDDEN_EXP))
                  el.classList.toggle(CLASS_VCLICK_HIDDEN, !show)

                // Reset CLASS_VCLICK_CURRENT to false.
                el.classList.toggle(CLASS_VCLICK_CURRENT, false)

                if (!el.classList.contains(CLASS_VCLICK_CURRENT))
                  el.classList.toggle(CLASS_VCLICK_PRIOR, show)
              },
              { immediate: true },
            )
          }
        },
        unmounted(el: HTMLElement) {
          el?.classList.toggle(CLASS_VCLICK_TARGET, true)
        },
      })

      app.directive('click-hide', {
        // @ts-expect-error extra prop
        name: 'v-click-hide',

        mounted(el: HTMLElement, dir) {
          if (isClicksDisabled.value || dirInject(dir, injectionClicksDisabled)?.value)
            return

          const elements = dirInject(dir, injectionClicksElements)
          const clicks = dirInject(dir, injectionClicks)

          const prev = elements?.value?.length || 0

          if (elements && !elements?.value?.includes(el))
            elements.value.push(el)

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          if (clicks) {
            watch(
              clicks,
              () => {
                const c = clicks?.value ?? 0
                const hide = dir.value != null
                  ? c >= dir.value
                  : c > prev
                el.classList.toggle(CLASS_VCLICK_HIDDEN, hide)
                el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, hide)
              },
              { immediate: true },
            )
          }
        },
        unmounted(el, dir) {
          el?.classList.toggle(CLASS_VCLICK_TARGET, false)
          const elements = dirInject(dir, injectionClicksElements)
          if (elements?.value)
            remove(elements.value, el)
        },
      })
    },
  }
}
