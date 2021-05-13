<script setup lang="ts">
import { useElementSize, useVModel } from '@vueuse/core'
import { computed, defineProps, ref, watchEffect, provide, defineEmit } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { slideAspect, slideWidth, slideHeight } from '../constants'
import { injectionClicks, injectionClicksDisabled, injectionClicksElements } from '../modules/directives'
import SlideWrapper from './SlideWrapper.vue'

const emit = defineEmit()
const props = defineProps({
  width: {
    type: Number,
  },
  meta: {
    default: () => ({}) as any,
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
  const no = props.no
  if (no != null)
    return `slidev-page-${no}`
  return ''
})
</script>

<template>
  <div id="slide-container" ref="root">
    <div id="slide-content" :style="style">
      <slot>
        <SlideWrapper :is="props.is" :class="classes" :clicks-disabled="true" />
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
