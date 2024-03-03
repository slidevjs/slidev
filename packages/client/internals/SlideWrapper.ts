import { computed, defineAsyncComponent, defineComponent, h, ref, toRef } from 'vue'
import type { PropType } from 'vue'
import { provideLocal } from '@vueuse/core'
import type { ClicksContext, RenderContext, SlideRoute } from '@slidev/types'
import { injectionActive, injectionClicksContext, injectionCurrentPage, injectionRenderContext, injectionRoute } from '../constants'
import SlideLoading from './SlideLoading.vue'

export default defineComponent({
  name: 'SlideWrapper',
  props: {
    clicksContext: {
      type: Object as PropType<ClicksContext>,
      required: true,
    },
    renderContext: {
      type: String,
      default: 'slide',
    },
    active: {
      type: Boolean,
      default: false,
    },
    is: {
      required: true,
    },
    route: {
      type: Object as PropType<SlideRoute>,
      required: true,
    },
  },
  setup(props) {
    provideLocal(injectionRoute, props.route)
    provideLocal(injectionCurrentPage, ref(props.route.no))
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

    const SlideComponent = defineAsyncComponent({
      loader: (props.is as any),
      delay: 300,
      loadingComponent: SlideLoading,
    })

    return () => h(SlideComponent, { style: style.value })
  },
})
