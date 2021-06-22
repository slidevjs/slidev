import { useVModel } from '@vueuse/core'
import { provide, defineComponent, h } from 'vue'
import { injectionClicks, injectionClicksDisabled, injectionClicksElements, injectionOrderMap } from '../modules/directives'

export default defineComponent({
  props: {
    clicks: {
      type: [Number, String],
      default: 0,
    },
    clicksElements: {
      type: Array,
      default: () => [] as Element[],
    },
    clicksOrderMap: {
      type: Map,
      default: () => new Map<number, HTMLElement[]>(),
    },
    clicksDisabled: {
      type: Boolean,
      default: false,
    },
    is: {
      type: Object,
      default: undefined,
    },
  },
  setup(props, { emit }) {
    const clicks = useVModel(props, 'clicks', emit)
    const clicksElements = useVModel(props, 'clicksElements', emit)
    const clicksDisabled = useVModel(props, 'clicksDisabled', emit)
    const clicksOrderMap = useVModel(props, 'clicksOrderMap', emit)

    clicksElements.value.length = 0

    provide(injectionClicks, clicks)
    provide(injectionClicksDisabled, clicksDisabled)
    provide(injectionClicksElements, clicksElements)
    provide(injectionOrderMap, clicksOrderMap)
  },
  render() {
    if (this.$props.is)
      return h(this.$props.is)
    return this.$slots?.default?.()
  },
})
