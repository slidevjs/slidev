<script setup lang="ts">
import type { ClicksContext } from '@slidev/types'
import { useSlideInfo } from '../composables/useSlideInfo'
import NoteDisplay from './NoteDisplay.vue'

const props = defineProps<{
  no: number
  class?: string
  clicksContext?: ClicksContext
  autoScroll?: boolean
}>()

const { info } = useSlideInfo(props.no)
</script>

<template>
  <NoteDisplay
    :class="props.class"
    :note="info?.note"
    :note-html="info?.noteHTML"
    :clicks-context="clicksContext"
    :auto-scroll="autoScroll"
  />
</template>
