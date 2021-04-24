<script setup lang="ts">
import { useElementSize, useVModel } from '@vueuse/core'
import { computed, defineProps, ref, watchEffect, inject, provide, defineEmit } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { slideAspect, slideWidth, slideHeight } from '../constants'
import { injectionTab, injectionTabDisabled, injectionTabElements } from '../modules/directives'

const emit = defineEmit()
const props = defineProps({
  width: {
    type: Number,
  },
  tab: {
    default: 0,
  },
  tabElements: {
    default: () => [] as Element[],
  },
  tabDisabled: {
    default: false,
  },
  meta: {
    default: () => ({}) as any,
  },
  route: {
    default: () => ({}) as any as RouteRecordRaw,
  },
})

const tab = useVModel(props, 'tab', emit)
const tabElements = useVModel(props, 'tabElements', emit)
const tabDisabled = useVModel(props, 'tabDisabled', emit)

tabElements.value = []

provide(injectionTab, tab)
provide(injectionTabElements, tabElements)
provide(injectionTabDisabled, tabDisabled)

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
  if (screenAspect.value < slideAspect)
    return width.value / slideWidth
  return height.value * slideAspect / slideWidth
})

const style = computed(() => ({
  height: `${slideHeight}px`,
  width: `${slideWidth}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
}))
</script>

<template>
  <div id="slide-container" ref="root">
    <div id="slide-content" :style="style">
      <component
        :is="route.component"
        :class="route.meta?.class"
      />
    </div>
    <slot name="controls" />
  </div>
</template>

<style lang="postcss">
#slide-container {
  @apply relative overflow-hidden select-none;
}

#slide-content {
  @apply relative overflow-hidden m-auto bg-main absolute left-1/2 top-1/2;
}
</style>
