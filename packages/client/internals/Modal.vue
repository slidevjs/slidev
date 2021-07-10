<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { shallowRef } from 'vue'

const emit = defineEmits<{}>()
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
  <KeepAlive>
    <div
      v-if="value"
      ref="container"
      class="fixed top-0 bottom-0 left-0 right-0 grid z-20"
      bg="black opacity-80"
      @click="onClick"
    >
      <div
        class="m-auto rounded-md bg-main shadow"
        dark:border="~ gray-400 opacity-10"
        :class="props.class"
      >
        <slot />
      </div>
    </div>
  </KeepAlive>
</template>
