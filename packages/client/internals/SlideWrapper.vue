<script setup lang="ts">
import { useElementSize, useVModel } from '@vueuse/core'
import { computed, defineProps, ref, watchEffect, provide, defineEmit } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { slideAspect, slideWidth, slideHeight } from '../constants'
import { injectionClicks, injectionClicksDisabled, injectionClicksElements } from '../modules/directives'

const emit = defineEmit()
const props = defineProps({
  clicks: {
    default: 0,
  },
  clicksElements: {
    default: () => [] as Element[],
  },
  clicksDisabled: {
    default: false,
  },
  is: {
    type: Object,
  },
})

const clicks = useVModel(props, 'clicks', emit)
const clicksElements = useVModel(props, 'clicksElements', emit)
const clicksDisabled = useVModel(props, 'clicksDisabled', emit)

clicksElements.value.length = 0

provide(injectionClicks, clicks)
provide(injectionClicksDisabled, clicksDisabled)
provide(injectionClicksElements, clicksElements)
</script>

<template>
  <component :is="props.is" />
</template>
