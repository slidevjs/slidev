import { InjectionKey, Ref, ref, watch } from 'vue'
import { remove } from '@antfu/utils'
import { UserModule } from '~/types'

export const injectClickCount: InjectionKey<Ref<number>> = Symbol('injectClickCount')
export const injectClickCurrent: InjectionKey<Ref<number>> = Symbol('injectClickCurrent')

export const clickElements = ref<Element[]>([])
export const clickCurrent = ref(0)

export const install: UserModule = ({ app }) => {
  app.directive('click', {
    // @ts-expect-error
    name: 'v-click',

    mounted(el: HTMLElement) {
      const prev = clickElements.value.length

      if (!clickElements.value.includes(el))
        clickElements.value.push(el)

      watch(
        clickCurrent,
        () => {
          const show = clickCurrent.value > prev
          el.classList.toggle('hidden', !show)
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

    mounted(el: HTMLElement) {
      const prev = clickElements.value.length

      watch(
        clickCurrent,
        () => {
          const show = clickCurrent.value > prev
          el.classList.toggle('hidden', !show)
        },
        { immediate: true },
      )
    },
  })
}
