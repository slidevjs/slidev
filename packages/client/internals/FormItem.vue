<script setup lang="ts">
import { Tooltip } from 'floating-vue'

defineProps<{
  title: string
  nested?: boolean | number
  div?: boolean
  description?: string
  dot?: boolean
}>()

const emit = defineEmits<{
  (event: 'reset'): void
}>()

function reset() {
  emit('reset')
}
</script>

<template>
  <component :is="div ? 'div' : 'label'" flex="~ row gap-2 items-center" select-none>
    <div w-30 h-8 flex="~ gap-1 items-center">
      <div
        v-if="nested" i-ri-corner-down-right-line op40
        :style="typeof nested === 'number' ? { marginLeft: `${nested * 0.5 + 0.5}rem` } : { marginLeft: '0.25rem' }"
      />
      <div v-if="!description" op75 relative @dblclick="reset">
        {{ title }}
        <div v-if="dot" w-1.5 h-1.5 bg-primary rounded absolute top-0 right--2 />
      </div>
      <Tooltip v-else distance="10">
        <div op75 text-right relative @dblclick="reset">
          {{ title }}
          <div v-if="dot" w-1.5 h-1.5 bg-primary rounded absolute top-0 right--2 />
        </div>
        <template #popper>
          <div text-sm min-w-90 v-html="description" />
        </template>
      </Tooltip>
    </div>
    <slot />
  </component>
</template>
