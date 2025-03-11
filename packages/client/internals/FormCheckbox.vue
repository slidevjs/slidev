<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const value = defineModel<boolean>('modelValue', {
  type: Boolean,
})
</script>

<template>
  <div border="~ main rounded" flex="~ gap-2 items-center" relative h-5 w-5 p0.5 hover:bg-active p1>
    <div i-ri-check-line :class="value ? '' : 'op0'" />
    <input v-model="value" type="checkbox" absolute inset-0 opacity-10 :disabled="disabled">
  </div>
</template>
