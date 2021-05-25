<script setup lang="ts">
import { slideScale } from '../state'
import SelectList from './SelectList.vue'
import type { SelectionItem } from './types'

const items: SelectionItem<number>[] = [
  {
    display: 'Fit',
    value: 0,
  },
  {
    display: '1:1',
    value: 1,
  },
]
</script>

<template>
  <div class="text-sm">
    <SelectList v-model="slideScale" title="Scale" :items="items" />
  </div>
</template>
