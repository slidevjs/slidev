<script setup lang="ts">
import { computed, inject } from 'vue'

import { injectionSlideContext } from '../constants'

type SlideContext = 'main' | 'slide' | 'overview' | 'presenter' | 'previewNext'

const props = defineProps<{
  context: SlideContext | SlideContext[]
}>()
const { context } = props

const currentContext = inject(injectionSlideContext)

const shouldRender = computed(() => context instanceof Array ? context.some(contextMatch) : contextMatch(context))

function contextMatch(context: SlideContext) {
  if (context === currentContext)
    return true
  if (context === 'main' && (currentContext === 'slide' || currentContext === 'presenter'))
    return true
  return false
}
</script>

<template>
  <slot v-if="shouldRender" />
</template>
