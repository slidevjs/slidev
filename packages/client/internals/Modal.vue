<script setup lang="ts">
import { useVModel } from '@vueuse/core'

const props = defineProps({
  modelValue: {
    default: false,
  },
  class: {
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const value = useVModel(props, 'modelValue', emit)

function onClick() {
  value.value = false
}
</script>

<template>
  <KeepAlive>
    <div v-if="value" class="fixed top-0 bottom-0 left-0 right-0 grid z-modal">
      <div
        bg="black opacity-80"
        class="absolute top-0 bottom-0 left-0 right-0 -z-1"
        @click="onClick()"
      />
      <div
        class="m-auto rounded-md bg-main shadow"
        dark:border="~ main"
        :class="props.class"
      >
        <slot />
      </div>
    </div>
  </KeepAlive>
</template>
