<script setup lang="ts">
import { showOverview, showRecordingDialog } from '../state'
import SlidesOverview from './SlidesOverview.vue'
import WebCamera from './WebCamera.vue'
import RecordingDialog from './RecordingDialog.vue'
</script>

<template>
  <SlidesOverview v-model="showOverview" />
  <template v-if="__DEV__">
    <WebCamera/>
    <RecordingDialog v-model="showRecordingDialog" />
  </template>
</template>
