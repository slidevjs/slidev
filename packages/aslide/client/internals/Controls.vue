<script setup lang="ts">
import { showOverview } from '../logic/state'
import SlidesOverview from './SlidesOverview.vue'
import SlideControls from './SlideControls.vue'
import WebCamera from './WebCamera.vue'
</script>

<template>
  <SlidesOverview v-model="showOverview" />
  <SlideControls />
  <WebCamera />
</template>
