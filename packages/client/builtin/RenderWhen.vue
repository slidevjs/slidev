<script setup lang="ts">
import { computed, inject } from 'vue'
import type { RenderContext } from '@slidev/types'

import { injectionRenderContext } from '../constants'

type Context = 'main' | RenderContext

const props = defineProps<{
  context: Context | Context[]
}>()
const { context } = props

const currentContext = inject(injectionRenderContext)

const shouldRender = computed(() => Array.isArray(context) ? context.some(contextMatch) : contextMatch(context))

function contextMatch(context: Context) {
  if (context === currentContext?.value)
    return true
  if (context === 'main' && (currentContext?.value === 'slide' || currentContext?.value === 'presenter'))
    return true
  return false
}
</script>

<template>
  <slot v-if="shouldRender" />
</template>
