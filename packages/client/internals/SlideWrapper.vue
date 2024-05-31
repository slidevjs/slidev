<script setup lang="ts">
import { computed, defineAsyncComponent, defineComponent, h, onMounted, ref, toRef } from 'vue'
import type { CSSProperties, PropType } from 'vue'
import { provideLocal } from '@vueuse/core'
import type { ClicksContext, RenderContext, SlideRoute } from '@slidev/types'
import { injectionClicksContext, injectionCurrentPage, injectionRenderContext, injectionRoute, injectionSlideZoom } from '../constants'
import { getSlideClass } from '../utils'
import { configs } from '../env'
import SlideLoading from './SlideLoading.vue'
import { SlideBottom, SlideTop } from '#slidev/global-layers'

const props = defineProps({
  clicksContext: {
    type: Object as PropType<ClicksContext>,
    required: true,
  },
  renderContext: {
    type: String as PropType<RenderContext>,
    default: 'slide',
  },
  route: {
    type: Object as PropType<SlideRoute>,
    required: true,
  },
})

const zoom = computed(() => props.route.meta?.slide?.frontmatter.zoom ?? 1)

provideLocal(injectionRoute, props.route)
provideLocal(injectionCurrentPage, ref(props.route.no))
provideLocal(injectionRenderContext, ref(props.renderContext))
provideLocal(injectionClicksContext, toRef(props, 'clicksContext'))
provideLocal(injectionSlideZoom, zoom)

const zoomStyle = computed(() => {
  return zoom.value === 1
    ? undefined
    : {
        width: `${100 / zoom.value}%`,
        height: `${100 / zoom.value}%`,
        transformOrigin: 'top left',
        transform: `scale(${zoom.value})`,
      }
})
const style = computed<CSSProperties>(() => ({
  ...zoomStyle.value,
  'user-select': configs.selectable ? undefined : 'none',
}))

const SlideComponent = computed(() => props.route && defineAsyncComponent({
  loader: async () => {
    const component = await props.route.component()
    return defineComponent({
      setup(_, { attrs }) {
        onMounted(() => props.clicksContext?.onMounted?.())
        return () => h(component.default, attrs)
      },
    })
  },
  delay: 300,
  loadingComponent: SlideLoading,
}))
</script>

<template>
  <div
    :data-slidev-no="props.route.no"
    :class="getSlideClass(route, ['slide', 'presenter'].includes(props.renderContext) ? '' : 'disable-view-transition')"
    :style="style"
  >
    <SlideBottom />
    <SlideComponent />
    <SlideTop />
  </div>
</template>

<style scoped>
.disable-view-transition:deep(*) {
  view-transition-name: none !important;
}

.slidev-page {
  position: absolute;
  inset: 0;
}
</style>
