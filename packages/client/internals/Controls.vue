<script setup lang="ts">
import { shallowRef } from 'vue'
import { showInfoDialog, showRecordingDialog } from '../state'
import { configs } from '../env'
import { useNav } from '../composables/useNav'
import QuickOverview from './QuickOverview.vue'
import InfoDialog from './InfoDialog.vue'
import Goto from './Goto.vue'
import ContextMenu from './ContextMenu.vue'

const { isEmbedded } = useNav()
const drawingEnabled = __SLIDEV_FEATURE_DRAWINGS__ && !configs.drawings.presenterOnly && !isEmbedded.value
const DrawingControls = shallowRef<any>()
if (drawingEnabled)
  import('../internals/DrawingControls.vue').then(v => DrawingControls.value = v.default)

const WebCamera = shallowRef<any>()
const RecordingDialog = shallowRef<any>()
if (__SLIDEV_FEATURE_RECORD__) {
  import('./WebCamera.vue').then(v => WebCamera.value = v.default)
  import('./RecordingDialog.vue').then(v => RecordingDialog.value = v.default)
}
</script>

<template>
  <DrawingControls v-if="drawingEnabled && DrawingControls" />
  <QuickOverview />
  <Goto />
  <WebCamera v-if="WebCamera" />
  <RecordingDialog v-if="RecordingDialog" v-model="showRecordingDialog" />
  <InfoDialog v-if="configs.info" v-model="showInfoDialog" />
  <ContextMenu />
</template>
