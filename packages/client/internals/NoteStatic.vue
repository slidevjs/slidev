<script setup lang="ts">
import { useSlideInfo } from '../logic/note'
import NoteDisplay from './NoteDisplay.vue'

const props = defineProps<{
  no?: number
  class?: string
  clicks?: number | string
}>()

const { info } = useSlideInfo(props.no)
</script>

<template>
  <NoteDisplay
    :class="props.class"
    :note="info?.note"
    :note-html="info?.noteHTML"
    :clicks="props.clicks"
  />
</template>
