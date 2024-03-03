<script setup lang="ts">
import { computed, defineAsyncComponent, ref, toRef } from 'vue'
import type { PropType } from 'vue'
import { provideLocal } from '@vueuse/core'
import type { ClicksContext, RenderContext, SlideRoute } from '@slidev/types'
import { injectionActive, injectionClicksContext, injectionCurrentPage, injectionRenderContext, injectionRoute } from '../constants'
import SlideLoading from './SlideLoading.vue'

const props = defineProps({
  clicksContext: {
    type: Object as PropType<ClicksContext>,
    required: true,
  },
  renderContext: {
    type: String as PropType<RenderContext>,
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
})

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
</script>

<template>
  <component :is="SlideComponent" :style="style" :class="{ 'disable-view-transition': !['slide', 'presenter'].includes(props.renderContext) }" />
</template>

<style scoped>
.disable-view-transition:deep(*) {
  view-transition-name: none !important;
}
</style>
