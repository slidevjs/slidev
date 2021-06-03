import { useVModel } from '@vueuse/core'
import { provide, defineComponent, h } from 'vue'
import { injectionClicks, injectionClicksDisabled, injectionClicksElements } from '../modules/directives'

export default defineComponent({
  props: {
    clicks: {
      default: 0,
    },
    clicksElements: {
      default: () => [] as Element[],
    },
    clicksDisabled: {
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

    clicksElements.value.length = 0

    provide(injectionClicks, clicks)
    provide(injectionClicksDisabled, clicksDisabled)
    provide(injectionClicksElements, clicksElements)
  },
  render() {
    if (this.$props.is)
      return h(this.$props.is)
    return this.$slots?.default?.()
  },
})
