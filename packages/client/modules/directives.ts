import { computed, DirectiveBinding, InjectionKey, ref, watch } from 'vue'
import { remove } from '@antfu/utils'
import { useUrlSearchParams } from '@vueuse/core'
import { UserModule } from '../types'

export const injectClickDisabled: InjectionKey<boolean> = Symbol('v-click-disabled')

export const clickElements = ref<HTMLElement[]>([])
const hash = useUrlSearchParams('hash')
export const clickCurrent = computed<number>({
  get() {
    let tab = +hash.tab || 0
    if (isNaN(tab))
      tab = 0
    return tab
  },
  set(v) {
    hash.tab = v.toString()
  },
})

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
      if (dirInject(dir, injectClickDisabled, false))
        return

      const prev = clickElements.value.length

      if (!clickElements.value.includes(el))
        clickElements.value.push(el)

      watch(
        clickCurrent,
        () => {
          const show = clickCurrent.value > prev
          el.classList.toggle('!opacity-0', !show)
          el.classList.toggle('!pointer-events-none', !show)
        },
        { immediate: true },
      )
    },
    unmounted(el) {
      remove(clickElements.value, el)
    },
  })

  app.directive('after', {
    // @ts-expect-error
    name: 'v-after',

    mounted(el: HTMLElement, dir) {
      if (dirInject(dir, injectClickDisabled, false))
        return

      const prev = clickElements.value.length

      watch(
        clickCurrent,
        () => {
          const show = clickCurrent.value >= prev
          el.classList.toggle('!opacity-0', !show)
          el.classList.toggle('!pointer-events-none', !show)
        },
        { immediate: true },
      )
    },
  })

  app.directive('click-disabled', {
    // @ts-expect-error
    name: 'v-click-disabled',

    mounted(el: HTMLElement, dir) {
      dirProvide(dir, injectClickDisabled, true)
    },

    beforeUnmount(el, dir) {
      dirProvide(dir, injectClickDisabled, false)
    },
  })
}
