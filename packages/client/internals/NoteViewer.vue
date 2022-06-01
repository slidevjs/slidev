<script setup lang="ts">
const props = defineProps<{
  class?: string
  noteHtml?: string
  note?: string
}>()

defineEmits(['click'])
</script>

<template>
  <div
    v-if="noteHtml"
    class="prose overflow-auto outline-none"
    :class="props.class"
    @click="$emit('click')"
    v-html="noteHtml"
  />
  <div
    v-else
    class="prose overflow-auto outline-none"
    :class="props.class"
    @click="$emit('click')"
    v-text="note"
  />
</template>
