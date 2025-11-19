<script setup lang="ts">
import type { ClicksContext, RenderContext, SlideRoute } from '@slidev/types'
import type { CSSProperties, PropType } from 'vue'
import { SlideBottom, SlideTop } from '#slidev/global-layers'
import { provideLocal } from '@vueuse/core'
import { computed, ref, toRef } from 'vue'
import { injectionClicksContext, injectionCurrentPage, injectionFrontmatter, injectionRenderContext, injectionRoute, injectionSlideZoom } from '../constants'
import { configs } from '../env'
import { getSlideClass } from '../utils'

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
provideLocal(injectionFrontmatter, props.route.meta.slide.frontmatter)
provideLocal(injectionCurrentPage, ref(props.route.no))
provideLocal(injectionRenderContext, ref(props.renderContext))
provideLocal(injectionClicksContext, toRef(props, 'clicksContext'))
provideLocal(injectionSlideZoom, zoom)

const style = computed<CSSProperties>(() => ({
  'user-select': configs.selectable ? undefined : 'none',
  '--slidev-slide-zoom-scale': zoom.value === 1 ? undefined : zoom.value,
}))
</script>

<template>
  <div
    :data-slidev-no="props.route.no"
    :class="getSlideClass(route, ['slide', 'presenter'].includes(props.renderContext) ? '' : 'disable-view-transition')"
    :style="style"
    :lang="props.route.meta.slide.frontmatter.lang"
  >
    <SlideBottom />
    <component :is="props.route.component" />
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

  /* Zoom handling */
  --slidev-slide-zoom-scale: 1;
  width: calc(100% / var(--slidev-slide-zoom-scale));
  height: calc(100% / var(--slidev-slide-zoom-scale));
  transform-origin: top left;
  scale: var(--slidev-slide-zoom-scale);
  /* slide scale = container scale * zoom scale */
  --slidev-slide-scale: calc(var(--slidev-slide-container-scale) * var(--slidev-slide-zoom-scale));
}
</style>
