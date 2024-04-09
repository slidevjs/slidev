<script setup lang="ts">
import { computed, defineAsyncComponent, defineComponent, h, onMounted, ref, toRef } from 'vue'
import type { PropType } from 'vue'
import { provideLocal } from '@vueuse/core'
import type { ClicksContext, RenderContext, SlideRoute } from '@slidev/types'
import { injectionActive, injectionClicksContext, injectionCurrentPage, injectionRenderContext, injectionRoute, injectionSlideZoom } from '../constants'
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
    type: Function as PropType<() => any>,
    required: true,
  },
  route: {
    type: Object as PropType<SlideRoute>,
    required: true,
  },
})

const zoom = computed(() => props.route.meta?.slide?.frontmatter.zoom ?? 1)

provideLocal(injectionRoute, props.route)
provideLocal(injectionCurrentPage, ref(props.route.no))
provideLocal(injectionRenderContext, ref(props.renderContext as RenderContext))
provideLocal(injectionActive, toRef(props, 'active'))
provideLocal(injectionClicksContext, toRef(props, 'clicksContext'))
provideLocal(injectionSlideZoom, zoom)

const style = computed(() => {
  return zoom.value === 1
    ? undefined
    : {
        width: `${100 / zoom.value}%`,
        height: `${100 / zoom.value}%`,
        transformOrigin: 'top left',
        transform: `scale(${zoom.value})`,
      }
})

const SlideComponent = defineAsyncComponent({
  loader: async () => {
    const component = await props.is()
    return defineComponent({
      setup(_, { attrs }) {
        onMounted(() => {
          props.clicksContext?.onMounted?.()
        })
        return () => h(component.default, attrs)
      },
    })
  },
  delay: 300,
  loadingComponent: SlideLoading,
})
</script>

<template>
  <component
    :is="SlideComponent"
    :style="style"
    :data-slidev-no="props.route.no"
    :class="{ 'disable-view-transition': !['slide', 'presenter'].includes(props.renderContext) }"
  />
</template>

<style scoped>
.disable-view-transition:deep(*) {
  view-transition-name: none !important;
}
</style>
