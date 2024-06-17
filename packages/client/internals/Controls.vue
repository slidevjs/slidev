<script setup lang="ts">
import { shallowRef } from 'vue'
import { showInfoDialog, showRecordingDialog } from '../state'
import { configs } from '../env'
import { useFeatures } from '../composables/useFeatures'
import QuickOverview from './QuickOverview.vue'
import InfoDialog from './InfoDialog.vue'
import Goto from './Goto.vue'
import ContextMenu from './ContextMenu.vue'

const features = useFeatures()

const DrawingControls = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ && features.allowToDraw)
  import('../internals/DrawingControls.vue').then(v => DrawingControls.value = v.default)

const WebCamera = shallowRef<any>()
const RecordingDialog = shallowRef<any>()
if (__SLIDEV_FEATURE_RECORD__) {
  import('./WebCamera.vue').then(v => WebCamera.value = v.default)
  import('./RecordingDialog.vue').then(v => RecordingDialog.value = v.default)
}
</script>

<template>
  <DrawingControls v-if="DrawingControls" />
  <QuickOverview />
  <Goto />
  <WebCamera v-if="WebCamera" />
  <RecordingDialog v-if="RecordingDialog" v-model="showRecordingDialog" />
  <InfoDialog v-if="configs.info" v-model="showInfoDialog" />
  <ContextMenu />
</template>
