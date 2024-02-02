<script setup lang="ts">
const props = defineProps({
  value: {
    default: false,
  },
  true: {
    default: 'true',
  },
  false: {
    default: 'false',
  },
  trueClass: {
    default: 'text-primary',
  },
  falseClass: {
    default: 'text-orange-400 dark:text-orange-300',
  },
})
</script>

<template>
  <span :class="props.value ? props.trueClass : props.falseClass">
    {{ props.value ? props.true : props.false }}
  </span>
</template>
