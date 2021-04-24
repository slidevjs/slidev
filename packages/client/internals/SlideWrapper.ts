
import { useVModel } from '@vueuse/core'
import { defineComponent, inject, provide } from 'vue'
import { injectionTab, injectionTabDisabled, injectionTabElements } from '../modules/directives'

export default defineComponent({
  name: 'SlideWrapper',
  props: {
    tab: {
      default: 0,
    },
    tabElements: {
      default: () => [] as Element[],
    },
    tabDisabled: {
      default: false,
    },
  },
  setup(props, { emit, slots }) {
    const tab = inject(injectionTab, useVModel(props, 'tab', emit, { passive: true }))
    const tabElements = inject(injectionTabElements, useVModel(props, 'tabElements', emit, { passive: true }))
    const tabDisabled = inject(injectionTabDisabled, useVModel(props, 'tabDisabled', emit, { passive: true }))

    tabElements.value = []

    provide(injectionTab, tab)
    provide(injectionTabElements, tabElements)
    provide(injectionTabDisabled, tabDisabled)

    return () => slots.default?.()[0]
  },
})
