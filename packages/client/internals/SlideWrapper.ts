import { useVModel } from '@vueuse/core'
import { computed, defineComponent, h, provide, ref, toRef } from 'vue'
import type { RenderContext } from '@slidev/types'
import { injectionActive, injectionClicks, injectionClicksDisabled, injectionClicksElements, injectionCurrentPage, injectionOrderMap, injectionRenderContext, injectionRoute } from '../constants'

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
    renderContext: {
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

    const clicksWithDisable = computed({
      get() {
        if (clicksDisabled.value)
          return 9999999
        return +clicks.value
      },
      set(value) {
        clicks.value = value
      },
    })

    provide(injectionRoute, props.route as any)
    provide(injectionCurrentPage, ref(+props.route?.path))
    provide(injectionRenderContext, ref(props.renderContext as RenderContext))
    provide(injectionActive, toRef(props, 'active'))
    provide(injectionClicks, clicksWithDisable)
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
