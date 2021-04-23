<script setup lang="ts">
import { showOverview } from '../state'
import SlidesOverview from './SlidesOverview.vue'
import WebCamera from './WebCamera.vue'
</script>

<template>
  <SlidesOverview v-model="showOverview" />
  <WebCamera />
</template>
