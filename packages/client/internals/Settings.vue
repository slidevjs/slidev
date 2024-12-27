<script setup lang="ts">
import { useWakeLock } from '@vueuse/core'
import { useNav } from '../composables/useNav'
import { hideCursorIdle, slideScale, viewerCssFilter, viewerCssFilterDefaults, wakeLockEnabled } from '../state'
import FormCheckbox from './FormCheckbox.vue'
import FormItem from './FormItem.vue'
import FormSlider from './FormSlider.vue'
import SegmentControl from './SegmentControl.vue'

const { isPresenter } = useNav()
const { isSupported } = useWakeLock()
</script>

<template>
  <div text-sm select-none flex="~ col gap-1" min-w-30 px4>
    <FormItem
      title="Invert"
      :dot="viewerCssFilter.invert !== viewerCssFilterDefaults.invert"
      @reset="viewerCssFilter.invert = viewerCssFilterDefaults.invert"
    >
      <FormCheckbox v-model="viewerCssFilter.invert" />
    </FormItem>
    <FormItem
      title="Brightness"
      :dot="viewerCssFilter.brightness !== viewerCssFilterDefaults.brightness"
      @reset="viewerCssFilter.brightness = viewerCssFilterDefaults.brightness"
    >
      <FormSlider
        v-model="viewerCssFilter.brightness"
        :max="1.5"
        :min="0.5"
        :step="0.02"
        :default="viewerCssFilterDefaults.brightness"
      />
    </FormItem>
    <FormItem
      title="Contrast"
      :dot="viewerCssFilter.contrast !== viewerCssFilterDefaults.contrast"
      @reset="viewerCssFilter.contrast = viewerCssFilterDefaults.contrast"
    >
      <FormSlider
        v-model="viewerCssFilter.contrast"
        :max="1.5"
        :min="0.5"
        :step="0.02"
        :default="viewerCssFilterDefaults.contrast"
      />
    </FormItem>
    <FormItem
      title="Saturation"
      :dot="viewerCssFilter.saturate !== viewerCssFilterDefaults.saturate"
      @reset="viewerCssFilter.saturate = viewerCssFilterDefaults.saturate"
    >
      <FormSlider
        v-model="viewerCssFilter.saturate"
        :max="1.5"
        :min="0.5"
        :step="0.02"
        :default="viewerCssFilterDefaults.saturate"
      />
    </FormItem>
    <FormItem
      title="Sepia"
      :dot="viewerCssFilter.sepia !== viewerCssFilterDefaults.sepia"
      @reset="viewerCssFilter.sepia = viewerCssFilterDefaults.sepia"
    >
      <FormSlider
        v-model="viewerCssFilter.sepia"
        :max="2"
        :min="-2"
        :step="0.02"
        :default="viewerCssFilterDefaults.sepia"
      />
    </FormItem>
    <FormItem
      title="Hue Rotate"
      :dot="viewerCssFilter.hueRotate !== viewerCssFilterDefaults.hueRotate"
      @reset="viewerCssFilter.hueRotate = viewerCssFilterDefaults.hueRotate"
    >
      <FormSlider
        v-model="viewerCssFilter.hueRotate"
        :max="180"
        :min="-180"
        :step="0.1"
        :default="viewerCssFilterDefaults.hueRotate"
      />
    </FormItem>
    <div class="h-1px opacity-5 bg-current w-full my2" />
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
