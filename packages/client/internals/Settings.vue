<script setup lang="ts">
import type { SelectionItem } from './types'
import { useWakeLock } from '@vueuse/core'
import { slideScale, wakeLockEnabled } from '../state'
import SelectList from './SelectList.vue'

const scaleItems: SelectionItem<number>[] = [
  {
    display: 'Fit',
    value: 0,
  },
  {
    display: '1:1',
    value: 1,
  },
]

const { isSupported } = useWakeLock()

const wakeLockItems: SelectionItem<boolean>[] = [
  {
    display: 'Enabled',
    value: true,
  },
  {
    display: 'Disabled',
    value: false,
  },
]
</script>

<template>
  <div class="text-sm select-none">
    <SelectList v-model="slideScale" title="Scale" :items="scaleItems" />
    <SelectList v-if="__SLIDEV_FEATURE_WAKE_LOCK__ && isSupported" v-model="wakeLockEnabled" title="Wake lock" :items="wakeLockItems" />
  </div>
</template>
