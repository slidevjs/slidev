<script setup lang="ts">
import { showOverview, showRecordingDialog, showInfoDialog } from '../state'
import SlidesOverview from './SlidesOverview.vue'
import WebCamera from './WebCamera.vue'
import RecordingDialog from './RecordingDialog.vue'
import InfoDialog from './InfoDialog.vue'
import Goto from './Goto.vue'
</script>

<template>
  <SlidesOverview v-model="showOverview" />
  <Goto />
  <template v-if="__DEV__">
    <WebCamera />
    <RecordingDialog v-model="showRecordingDialog" />
  </template>
  <template v-else>
    <InfoDialog v-model="showInfoDialog" />
  </template>
</template>
