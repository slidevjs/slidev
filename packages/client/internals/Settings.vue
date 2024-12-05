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
  <div class="text-sm select-none mb-2">
    <SelectList v-model="slideScale" title="Scale" :items="scaleItems" />
    <SelectList v-if="__SLIDEV_FEATURE_WAKE_LOCK__ && isSupported" v-model="wakeLockEnabled" title="Wake lock" :items="wakeLockItems" />
    <div class="text-xs uppercase opacity-50 tracking-widest px-7 py-1 select-none text-nowrap">
      Actions
    </div>
    <RouterLink v-if="__SLDIEV_FEATURE_EXPORTING_UI__" to="/export" class="block px-2 flex gap-1 py-1 hover:bg-gray-400 hover:bg-opacity-10">
      <div class="i-carbon:export text-3 w-4 op-80 my-a" />
      Export as
    </RouterLink>
  </div>
</template>
