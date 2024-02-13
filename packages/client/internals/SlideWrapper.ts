import { defineComponent, h, provide, ref, toRef } from 'vue'
import type { PropType } from 'vue'
import type { ClicksContext, RenderContext } from '@slidev/types'
import { injectionActive, injectionClicksContext, injectionCurrentPage, injectionRenderContext, injectionRoute } from '../constants'

export default defineComponent({
  name: 'SlideWrapper',
  props: {
    clicksContext: {
      type: Object as PropType<ClicksContext>,
      required: true,
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
  setup(props) {
    provide(injectionRoute, props.route as any)
    provide(injectionCurrentPage, ref(+props.route?.path))
    provide(injectionRenderContext, ref(props.renderContext as RenderContext))
    provide(injectionActive, toRef(props, 'active'))
    provide(injectionClicksContext, toRef(props, 'clicksContext'))
  },
  render() {
    if (this.$props.is)
      return h(this.$props.is)
    return this.$slots?.default?.()
  },
})
