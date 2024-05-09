<script setup lang="ts">
import { onClickOutside, useVModel } from '@vueuse/core'
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    default: false,
  },
  disabled: {
    default: false,
  },
})

const emit = defineEmits<{
  (e: any): void
}>()
const value = useVModel(props, 'modelValue', emit, { passive: true })
const el = ref<HTMLDivElement>()

onClickOutside(el, () => {
  value.value = false
})
</script>

<template>
  <div ref="el" class="flex relative">
    <button :class="{ disabled }" @click="value = !value">
      <slot name="button" :class="{ disabled }" />
    </button>
    <KeepAlive>
      <div
        v-if="value"
        class="rounded-md bg-main text-main shadow absolute bottom-10 left-0 z-20"
        dark:border="~ main"
      >
        <slot name="menu" />
      </div>
    </KeepAlive>
  </div>
</template>
