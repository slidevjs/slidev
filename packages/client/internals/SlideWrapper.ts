
import { useVModel } from '@vueuse/core'
import { defineComponent, provide } from 'vue'
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
    const tab = useVModel(props, 'tab', emit, { passive: true })
    const tabElements = useVModel(props, 'tabElements', emit, { passive: true })
    const tabDisabled = useVModel(props, 'tabDisabled', emit, { passive: true })

    provide(injectionTab, tab)
    provide(injectionTabElements, tabElements)
    provide(injectionTabDisabled, tabDisabled)

    return () => slots.default?.()[0]
  },
})
