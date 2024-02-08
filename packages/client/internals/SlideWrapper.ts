import { useVModel } from '@vueuse/core'
import { computed, defineComponent, h, provide, reactive, ref, toRef } from 'vue'
import type { RenderContext } from '@slidev/types'
import { injectionActive, injectionClicks, injectionClicksDisabled, injectionClicksFlow, injectionClicksMaxMap, injectionCurrentPage, injectionRenderContext, injectionRoute } from '../constants'

export default defineComponent({
  name: 'SlideWrapper',
  props: {
    clicks: {
      type: [Number, String],
      default: 0,
    },
    clicksDisabled: {
      type: Boolean,
      default: false,
    },
    clicksFlow: {
      type: Set,
      default: () => new Set(),
    },
    clicksMaxMap: {
      type: Map,
      default: () => reactive(new Map()),
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
    const clicksDisabled = useVModel(props, 'clicksDisabled', emit)
    const clicksFlow = useVModel(props, 'clicksFlow', emit)
    const clicksMaxMap = useVModel(props, 'clicksMaxMap', emit)

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
    provide(injectionClicksFlow, clicksFlow as any)
    provide(injectionClicksMaxMap, clicksMaxMap as any)
  },
  render() {
    if (this.$props.is)
      return h(this.$props.is)
    return this.$slots?.default?.()
  },
})
