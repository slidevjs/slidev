<script setup lang="ts">
import type { SelectionItem } from './types'
import { useWakeLock } from '@vueuse/core'
import { useNav } from '../composables/useNav'
import { slideScale, wakeLockEnabled } from '../state'
import SelectList from './SelectList.vue'

const { isPresenter } = useNav()
const { isSupported } = useWakeLock()

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
  <div text-sm select-none flex="~ col gap-2" min-w-30>
    <SelectList
      v-if="!isPresenter"
      v-model="slideScale"
      title="Scale"
      :items="scaleItems"
    />
    <div class="h-1px opacity-10 bg-current w-full" />
    <SelectList
      v-if="__SLIDEV_FEATURE_WAKE_LOCK__ && isSupported"
      v-model="wakeLockEnabled"
      title="Wake lock"
      :items="wakeLockItems"
    />
  </div>
</template>
