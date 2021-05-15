<script setup lang="ts">
import { shallowRef } from 'vue'
import { showOverview, showRecordingDialog, showInfoDialog } from '../state'
import { configs } from '../env'
import SlidesOverview from './SlidesOverview.vue'
import InfoDialog from './InfoDialog.vue'
import Goto from './Goto.vue'

const WebCamera = shallowRef<any>()
const RecordingDialog = shallowRef<any>()
if (__DEV__) {
  import('./WebCamera.vue').then(v => WebCamera.value = v.default)
  import('./RecordingDialog.vue').then(v => RecordingDialog.value = v.default)
}
</script>

<template>
  <SlidesOverview v-model="showOverview" />
  <Goto />
  <template v-if="__DEV__">
    <WebCamera v-if="WebCamera" />
    <RecordingDialog v-if="RecordingDialog" v-model="showRecordingDialog" />
  </template>
  <InfoDialog v-if="configs.info" v-model="showInfoDialog" />
</template>
