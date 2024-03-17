<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { computed } from 'vue'
import NoteDisplay from './NoteDisplay.vue'
import HandoutBottom from '#slidev/global-components/handout-bottom'

const props = defineProps<{
  route: SlideRoute
  index: number
}>()
const route = computed(() => props.route)
</script>

<template>
  <div class="break-after-page">
    <!--A4 specific, figure out better customization-->
    <div class="w-full mt-104 h-176 flex flex-col relative overflow-hidden">
      <NoteDisplay v-if="route.meta?.slide!.noteHTML" :note-html="route.meta?.slide!.noteHTML"
        class="w-full mx-auto px-2 handout-notes" />

      <div class="">
        <HandoutBottom :pageNumber="index + 100" />
        <!-- I would like to do this in HandoutBottom, but somehow props don't get passed. -->
        <div class="absolute bottom-5 right-0 text-right text-[11px] ">
          {{ index + 1 }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.handout-notes {
  @apply max-w-186;
  /* Overwrite if necessary: A4 specific */
}
</style>
