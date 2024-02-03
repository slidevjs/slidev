<script setup lang="ts">
import type { RenderContext } from '@slidev/types'
import { computed, inject, ref } from 'vue'
import { useElementVisibility } from '@vueuse/core'
import { injectionRenderContext } from '../constants'

type Context = 'main' | 'visible' | RenderContext

const props = defineProps<{
  context: Context | Context[]
}>()
const { context } = props
const target = ref(null)
const targetVisible = useElementVisibility(target)
const currentContext = inject(injectionRenderContext)
const shouldRender = computed(() => {
  const anyContext = Array.isArray(context) ? context.some(contextMatch) : contextMatch(context)
  const allConditions = Array.isArray(context) ? context.every(conditionsMatch) : conditionsMatch(context)

  return anyContext && allConditions
})

function contextMatch(context: Context) {
  if (context === currentContext?.value)
    return true
  if (context === 'main' && (currentContext?.value === 'slide' || currentContext?.value === 'presenter'))
    return true
  if (context === 'visible')
    return true
  return false
}

function conditionsMatch(context: Context) {
  if (context === 'visible')
    return targetVisible.value
  return true
}
</script>

<template>
  <div ref="target">
    <slot v-if="shouldRender" />
  </div>
</template>
