<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed } from 'vue'

import NoteDisplay from './NoteDisplay.vue'

// @ts-expect-error virtual module
import HandoutBottom from '/@slidev/global-components/handout-bottom'

const props = defineProps<{ route: RouteRecordRaw; index: number }>()

const route = computed(() => props.route)
</script>

<template>
  <div class="pb-12 h-176 flex flex-col break-after-page relative overflow-hidden px-6 mt-104">
    <NoteDisplay v-if="route.meta?.slide!.noteHTML" :note-html="route.meta?.slide!.noteHTML" class="grow handout-notes" />
    <div v-else class="grow" />
    <div>
      <HandoutBottom />
      <div class="text-right mt-3 text-xs ">
        {{ index + 1 }}
      </div>
    </div>
  </div>
</template>
