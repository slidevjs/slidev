<script setup lang="ts">
import { computed, inject } from 'vue'
import type { RenderContext } from '@slidev/types'

import { injectionSlideContext } from '../constants'

type Context = 'main' | RenderContext

const props = defineProps<{
  context: Context | Context[]
}>()
const { context } = props

const currentContext = inject(injectionSlideContext)

const shouldRender = computed(() => Array.isArray(context) ? context.some(contextMatch) : contextMatch(context))

function contextMatch(context: Context) {
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
