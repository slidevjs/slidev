import { DirectiveBinding, InjectionKey, Ref, watch } from 'vue'
import { remove } from '@antfu/utils'
import { UserModule } from '../types'
import { isPrintMode } from '../state'

export const injectionTab: InjectionKey<Ref<number>> = Symbol('v-click-tab')
export const injectionTabElements: InjectionKey<Ref<Element[]>> = Symbol('v-click-tab-elements')
export const injectionTabDisabled: InjectionKey<Ref<boolean>> = Symbol('v-click-tab-disabled')

export function dirProvide<T>(dir: DirectiveBinding<any>, key: InjectionKey<T>, v: T) {
  (dir.instance?.$ as any).provides[key as any] = v
}

export function dirInject<T = unknown>(dir: DirectiveBinding<any>, key: InjectionKey<T> | string, defaultValue?: T): T | undefined {
  return (dir.instance?.$ as any).provides[key as any] ?? defaultValue
}

export const install: UserModule = ({ app }) => {
  app.directive('click', {
    // @ts-expect-error
    name: 'v-click',

    mounted(el: HTMLElement, dir) {
      if (isPrintMode.value || dirInject(dir, injectionTabDisabled)!.value)
        return

      const elements = dirInject(dir, injectionTabElements)!
      const tab = dirInject(dir, injectionTab)!

      const prev = elements.value.length

      if (!elements.value.includes(el))
        elements.value.push(el)

      console.log('mount', prev, '->', elements.value.length)

      watch(
        tab,
        () => {
          const show = tab.value > prev
          el.classList.toggle('!opacity-0', !show)
          el.classList.toggle('!pointer-events-none', !show)
        },
        { immediate: true },
      )
    },
    unmounted(el, dir) {
      const elements = dirInject(dir, injectionTabElements)!
      remove(elements.value, el)
    },
  })

  app.directive('after', {
    // @ts-expect-error
    name: 'v-after',

    mounted(el: HTMLElement, dir) {
      if (isPrintMode.value || dirInject(dir, injectionTabDisabled)!.value)
        return

      const elements = dirInject(dir, injectionTabElements)!
      const tab = dirInject(dir, injectionTab)!

      const prev = elements.value.length

      watch(
        tab,
        () => {
          const show = tab.value >= prev
          // console.log('watch v-after', prev, tab.value, show, el.className)
          el.classList.toggle('!opacity-0', !show)
          el.classList.toggle('!pointer-events-none', !show)
        },
        { immediate: true },
      )
    },
  })
}
