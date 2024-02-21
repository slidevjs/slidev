import { computed, defineComponent, h, ref, toRef } from 'vue'
import type { PropType } from 'vue'
import { provideLocal } from '@vueuse/core'
import type { ClicksContext, RenderContext } from '@slidev/types'
import type { RouteRecordRaw } from 'vue-router'
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
      required: true,
    },
    route: {
      type: Object as PropType<RouteRecordRaw>,
      required: true,
    },
  },
  setup(props) {
    provideLocal(injectionRoute, props.route)
    provideLocal(injectionCurrentPage, ref(+props.route.path))
    provideLocal(injectionRenderContext, ref(props.renderContext as RenderContext))
    provideLocal(injectionActive, toRef(props, 'active'))
    provideLocal(injectionClicksContext, toRef(props, 'clicksContext'))

    const style = computed(() => {
      const zoom = props.route.meta?.slide?.frontmatter.zoom ?? 1
      return zoom === 1
        ? undefined
        : {
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
            transformOrigin: 'top left',
            transform: `scale(${zoom})`,
          }
    })

    return {
      style,
    }
  },
  render() {
    return h(this.$props.is, { style: this.style })
  },
})
