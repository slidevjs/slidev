<script setup lang="ts">
const props = defineProps<{
  class?: string
  noteHtml?: string
  note?: string
  placeholder?: string
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
    v-else-if="note"
    class="prose overflow-auto outline-none"
    :class="props.class"
    @click="$emit('click')"
  >
    <p v-text="note" />
  </div>
  <div
    v-else
    class="prose overflow-auto outline-none opacity-50 italic"
    :class="props.class"
    @click="$emit('click')"
  >
    <p v-text="props.placeholder || 'No notes.'" />
  </div>
</template>
