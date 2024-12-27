<script setup lang="ts">
import type { PropType } from 'vue'
import type { SelectionItem } from './types'
import { useVModel } from '@vueuse/core'

const props = defineProps({
  modelValue: {
    type: [Object, String, Number, Boolean] as PropType<any>,
  },
  title: {
    type: String,
  },
  items: {
    type: Array as PropType<SelectionItem<any>[]>,
  },
})

const emit = defineEmits<{
  (e: any): void
}>()
const value = useVModel(props, 'modelValue', emit, { passive: true })
</script>

<template>
  <div class="select-list">
    <div class="title">
      {{ title }}
    </div>
    <div class="items">
      <div
        v-for="item of items"
        :key="item.value"
        class="item"
        :class="{ active: value === item.value }"
        @click="() => { value = item.value; item.onClick?.() }"
      >
        <div class="i-carbon:checkmark text-green-500 mya" :class="{ 'opacity-0': value !== item.value }" />
        <div :class="{ 'opacity-50': value !== item.value }">
          {{ item.display || item.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.item {
  @apply flex rounded whitespace-nowrap py-1 gap-1 px-2 cursor-default hover:bg-gray-400 hover:bg-opacity-10;
}

.title {
  @apply text-sm op75 px3 py1 select-none text-nowrap font-bold;
}
</style>
