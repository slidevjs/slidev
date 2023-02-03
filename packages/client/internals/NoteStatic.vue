<script setup lang="ts">
import { computed } from 'vue'
import { currentRoute } from '../logic/nav'
import NoteDisplay from './NoteDisplay.vue'

const props = defineProps<{
  class?: string
}>()

const note = computed(() => currentRoute.value?.meta?.slide?.note)
const noteHtml = computed(() => currentRoute.value?.meta?.slide?.noteHTML)
</script>

<template>
  <NoteDisplay
    :class="props.class"
    :note="note"
    :note-html="noteHtml"
  />
</template>
