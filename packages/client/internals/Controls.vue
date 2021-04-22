<script setup lang="ts">
import { showOverview, showEditor } from '../logic/state'
import SlidesOverview from './SlidesOverview.vue'
import SlideControls from './SlideControls.vue'
import WebCamera from './WebCamera.vue'
import Editor from './Editor.vue'
</script>

<template>
  <SlidesOverview v-model="showOverview" />
  <SlideControls />
  <WebCamera />
  <Editor v-if="showEditor" />
</template>
