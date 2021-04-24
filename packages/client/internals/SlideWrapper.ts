
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
    if (!inject(injectionTab))
      provide(injectionTab, useVModel(props, 'tab', emit))
    if (!inject(injectionTabElements))
      provide(injectionTabElements, useVModel(props, 'tabElements', emit))
    if (!inject(injectionTabDisabled))
      provide(injectionTabDisabled, useVModel(props, 'tabDisabled', emit, { passive: true }))

    return () => slots.default?.()[0]
  },
})
