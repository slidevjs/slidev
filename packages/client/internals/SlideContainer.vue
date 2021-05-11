<script setup lang="ts">
import { useElementSize, useVModel } from '@vueuse/core'
import { computed, defineProps, ref, watchEffect, provide, defineEmit } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { slideAspect, slideWidth, slideHeight } from '../constants'
import { injectionClicks, injectionClicksDisabled, injectionClicksElements } from '../modules/directives'

const emit = defineEmit()
const props = defineProps({
  width: {
    type: Number,
  },
  clicks: {
    default: 0,
  },
  clicksElements: {
    default: () => [] as Element[],
  },
  clicksDisabled: {
    default: false,
  },
  meta: {
    default: () => ({}) as any,
  },
  route: {
    default: () => ({}) as any as RouteRecordRaw,
  },
  scale: {
    type: Number,
  },
  no: {
    type: Number,
  },
  is: {
    type: Object,
  },
})

const clicks = useVModel(props, 'clicks', emit)
const clicksElements = useVModel(props, 'clicksElements', emit)
const clicksDisabled = useVModel(props, 'clicksDisabled', emit)

clicksElements.value = []

provide(injectionClicks, clicks)
provide(injectionClicksDisabled, clicksDisabled)
provide(injectionClicksElements, clicksElements)

const root = ref<HTMLDivElement>()
const element = useElementSize(root)

const width = computed(() => props.width ? props.width : element.width.value)
const height = computed(() => props.width ? props.width / slideAspect : element.height.value)

if (props.width) {
  watchEffect(() => {
    if (root.value) {
      root.value.style.width = `${width.value}px`
      root.value.style.height = `${height.value}px`
    }
  })
}

const screenAspect = computed(() => width.value / height.value)

const scale = computed(() => {
  if (props.scale != null)
    return props.scale
  if (screenAspect.value < slideAspect)
    return width.value / slideWidth
  return height.value * slideAspect / slideWidth
})

const style = computed(() => ({
  height: `${slideHeight}px`,
  width: `${slideWidth}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
}))

const classes = computed(() => {
  const no = props.no ?? props.route?.meta?.slide?.no
  if (no != null)
    return `slidev-page-${no}`
  return ''
})
</script>

<template>
  <div id="slide-container" ref="root">
    <div id="slide-content" :style="style">
      <slot>
        <component :is="props.is || route.component" :class="classes" />
      </slot>
    </div>
    <slot name="controls" />
  </div>
</template>

<style lang="postcss">
#slide-container {
  @apply relative overflow-hidden select-none;
}

#slide-content {
  @apply relative overflow-hidden bg-main absolute left-1/2 top-1/2;
}
</style>
