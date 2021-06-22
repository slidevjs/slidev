import { App, DirectiveBinding, InjectionKey, Ref, watch } from 'vue'
import { remove } from '@antfu/utils'
import { isPrintMode, isPrintWithClicks } from '../logic/nav'

export const injectionClicks: InjectionKey<Ref<number>> = Symbol('v-click-clicks')
export const injectionClicksElements: InjectionKey<Ref<(Element | string)[]>> = Symbol('v-click-clicks-elements')
export const injectionOrderMap: InjectionKey<Ref<Map<number, HTMLElement[]>>> = Symbol('v-click-clicks-order-map')
export const injectionClicksDisabled: InjectionKey<Ref<boolean>> = Symbol('v-click-clicks-disabled')

export const CLASS_VCLICK_TARGET = 'slidev-vclick-target'
export const CLASS_VCLICK_HIDDEN = 'slidev-vclick-hidden'
export const CLASS_VCLICK_GONE = 'slidev-vclick-gone'
export const CLASS_VCLICK_HIDDEN_EXP = 'slidev-vclick-hidden-explicitly'
export const CLASS_VCLICK_CURRENT = 'slidev-vclick-current'
export const CLASS_VCLICK_PRIOR = 'slidev-vclick-prior'

function dirInject<T = unknown>(dir: DirectiveBinding<any>, key: InjectionKey<T> | string, defaultValue?: T): T | undefined {
  return (dir.instance?.$ as any).provides[key as any] ?? defaultValue
}

export default function createDirectives() {
  return {
    install(app: App) {
      app.directive('click', {
        // @ts-expect-error
        name: 'v-click',

        mounted(el: HTMLElement, dir) {
          if ((isPrintMode.value && !isPrintWithClicks.value) || dirInject(dir, injectionClicksDisabled)?.value)
            return

          const elements = dirInject(dir, injectionClicksElements)
          const clicks = dirInject(dir, injectionClicks)
          const orderMap = dirInject(dir, injectionOrderMap)

          const hide = dir.modifiers.hide

          const prev = elements?.value?.length || 0

          if (elements && !elements?.value?.includes(el))
            elements.value.push(el)

          // Set default dir.value
          if (dir.value === undefined)
            dir.value = elements?.value.length

          // If orderMap didn't have dir.value, then initializ it.
          // Or we move current element to the first of order array
          // to make sure the after click current state.
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
                  el.classList.toggle(CLASS_VCLICK_HIDDEN, !show)

                if (hide)
                  el.classList.toggle(CLASS_VCLICK_HIDDEN, show)

                // Reset CLASS_VCLICK_CURRENT to false
                el.classList.toggle(CLASS_VCLICK_CURRENT, false)

                const currentElArray = orderMap?.value.get(c)
                currentElArray?.forEach((cEl, idx) => {
                  // Reset CLASS_VCLICK_PRIOR to false
                  cEl.classList.toggle(CLASS_VCLICK_PRIOR, false)
                  // If the element is the last of order array, then set it
                  // as CLASS_VCLICK_CURRENT, others set as CLASS_VCLICK_PRIOR
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
        // @ts-expect-error
        name: 'v-after',

        mounted(el: HTMLElement, dir) {
          if ((isPrintMode.value && !isPrintWithClicks.value) || dirInject(dir, injectionClicksDisabled)?.value)
            return

          const elements = dirInject(dir, injectionClicksElements)
          const clicks = dirInject(dir, injectionClicks)
          const orderMap = dirInject(dir, injectionOrderMap)

          const prev = elements?.value.length

          // Set default dir.value
          if (dir.value === undefined)
            dir.value = elements?.value.length

          // If click's order before after is bigger than after, the order map will not
          // contain the key of after, so we need to set it first, the move after element
          // to last of the order array
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

                // Reset CLASS_VCLICK_CURRENT to false
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
        // @ts-expect-error
        name: 'v-click-hide',

        mounted(el: HTMLElement, dir) {
          if ((isPrintMode.value && !isPrintWithClicks.value) || dirInject(dir, injectionClicksDisabled)?.value)
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
