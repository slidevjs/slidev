<script setup lang="ts">
import { showOverview, showRecordingDialog } from '../state'
import SlidesOverview from './SlidesOverview.vue'
import WebCamera from './WebCamera.vue'
import RecordingDialog from './RecordingDialog.vue'
</script>

<template>
  <SlidesOverview v-model="showOverview" />
  <WebCamera />
  <RecordingDialog v-model="showRecordingDialog"/>
</template>
