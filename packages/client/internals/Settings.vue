<script setup lang="ts">
import { useWakeLock } from '@vueuse/core'
import { useNav } from '../composables/useNav'
import { hideCursorIdle, slideScale, wakeLockEnabled } from '../state'
import FormCheckbox from './FormCheckbox.vue'
import FormItem from './FormItem.vue'
import SegmentControl from './SegmentControl.vue'

const { isPresenter } = useNav()
const { isSupported } = useWakeLock()
</script>

<template>
  <div text-sm select-none flex="~ col gap-1" min-w-30 px4>
    <FormItem
      v-if="!isPresenter"
      title="Slide Scale"
    >
      <SegmentControl
        v-model="slideScale"
        :options="[
          { label: 'Fit', value: 0 },
          { label: '1:1', value: 1 },
        ]"
      />
    </FormItem>
    <FormItem
      v-if="__SLIDEV_FEATURE_WAKE_LOCK__ && isSupported"
      title="Wake Lock"
    >
      <FormCheckbox v-model="wakeLockEnabled" />
    </FormItem>
    <FormItem
      v-if="!isPresenter"
      title="Hide Idle Cursor"
    >
      <FormCheckbox v-model="hideCursorIdle" />
    </FormItem>
  </div>
</template>
