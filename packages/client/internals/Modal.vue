<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { defineEmit, defineProps, shallowRef } from 'vue'

const emit = defineEmit()
const props = defineProps({
  modelValue: {
    default: false,
  },
  class: {
    default: '',
  },
})

const value = useVModel(props, 'modelValue', emit)
const container = shallowRef<HTMLDivElement>()

function onClick(e: MouseEvent) {
  if (e?.target === container.value)
    value.value = false
}
</script>

<template>
  <div
    v-show="value"
    ref="container"
    class="fixed top-0 bottom-0 left-0 right-0 bg-black bg-opacity-80 grid"
    @click="onClick"
  >
    <div
      class="m-auto rounded-md bg-main shadow dark:(border border-gray-400 border-opacity-10)w"
      :class="props.class"
    >
      <slot />
    </div>
  </div>
</template>
