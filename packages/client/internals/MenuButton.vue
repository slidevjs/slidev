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
        class="bg-main text-main shadow-xl absolute bottom-10 left-0 z-menu py2"
        border="~ main rounded-md"
      >
        <slot name="menu" />
      </div>
    </KeepAlive>
  </div>
</template>
