import { useVModel } from '@vueuse/core'
import type { Ref } from 'vue'
import { defineComponent, h, provide, toRef } from 'vue'
import type { RenderContext } from '@slidev/types'
import { injectionActive, injectionClicks, injectionClicksDisabled, injectionClicksElements, injectionCurrentPage, injectionOrderMap, injectionRoute, injectionSlideContext } from '../constants'

export default defineComponent({
  name: 'SlideWrapper',
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
    context: {
      type: String,
      default: 'main',
    },
    active: {
      type: Boolean,
      default: false,
    },
    is: {
      type: Object,
      default: undefined,
    },
    route: {
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

    provide(injectionRoute, props.route as any)
    provide(injectionCurrentPage, +props.route?.path)
    provide(injectionSlideContext, props.context as RenderContext)
    provide(injectionActive, toRef(props, 'active'))
    provide(injectionClicks, clicks as Ref<number>)
    provide(injectionClicksDisabled, clicksDisabled)
    provide(injectionClicksElements, clicksElements as any)
    provide(injectionOrderMap, clicksOrderMap as any)
  },
  render() {
    if (this.$props.is)
      return h(this.$props.is)
    return this.$slots?.default?.()
  },
})
