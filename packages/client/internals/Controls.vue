<script setup lang="ts">
import { shallowRef } from 'vue'
import { showInfoDialog, showOverview, showRecordingDialog } from '../state'
import { configs } from '../env'
import QuickOverview from './QuickOverview.vue'
import InfoDialog from './InfoDialog.vue'
import Goto from './Goto.vue'

const WebCamera = shallowRef<any>()
const RecordingDialog = shallowRef<any>()
if (__SLIDEV_FEATURE_RECORD__) {
  import('./WebCamera.vue').then(v => WebCamera.value = v.default)
  import('./RecordingDialog.vue').then(v => RecordingDialog.value = v.default)
}
</script>

<template>
  <QuickOverview v-model="showOverview" />
  <Goto />
  <WebCamera v-if="WebCamera" />
  <RecordingDialog v-if="RecordingDialog" v-model="showRecordingDialog" />
  <InfoDialog v-if="configs.info" v-model="showInfoDialog" />
</template>
