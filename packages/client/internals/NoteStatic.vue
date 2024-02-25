<script setup lang="ts">
import type { ClicksContext } from 'packages/types'
import { useSlideInfo } from '../logic/note'
import NoteDisplay from './NoteDisplay.vue'

const props = defineProps<{
  no?: number
  class?: string
  clicksContext?: ClicksContext
}>()

const { info } = useSlideInfo(props.no)
</script>

<template>
  <NoteDisplay
    :class="props.class"
    :note="info?.note"
    :note-html="info?.noteHTML"
    :clicks-context="clicksContext"
  />
</template>
