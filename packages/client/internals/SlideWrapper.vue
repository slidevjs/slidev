<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { defineProps, provide, defineEmit } from 'vue'
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
    default: undefined,
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
