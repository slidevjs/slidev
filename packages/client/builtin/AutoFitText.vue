<!--
Think of this component as the TextBox that you will see
in PowerPoint or Keynote. It will automatically resize
the font size based on its content to fit them in,
powered by fitty (https://github.com/rikschennink/fitty).

Usage:

<AutoFitText modelValue="text"/>

or

<AutoFitText :max="100" :min="30" v-model="text"/>
-->

<script setup lang="ts">
import type { FittyInstance } from 'fitty'
import { useResizeObserver, useVModel } from '@vueuse/core'
import fitty from 'fitty'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    default: '',
  },
  max: {
    default: 100,
  },
  min: {
    default: 30,
  },
  multiLine: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const value = useVModel(props, 'modelValue', emit)

const container = ref<HTMLDivElement>()
const inner = ref<HTMLDivElement>()

let instance: FittyInstance | undefined

function init() {
  instance?.unsubscribe()
  instance = undefined
  if (!inner.value)
    return
  instance = fitty(inner.value, {
    minSize: props.min,
    maxSize: props.max,
    multiLine: props.multiLine,
  })
}

onMounted(() => {
  init()
  // Refit once web fonts are loaded, as glyph metrics may change
  document.fonts?.ready.then(() => instance?.fit())
})

onUnmounted(() => {
  instance?.unsubscribe()
  instance = undefined
})

watch(() => [props.min, props.max, props.multiLine], init)

// Fitty observes content mutations and window resizes on its own,
// but not resizes of the container itself
useResizeObserver(container, () => {
  if (!container.value || container.value.clientWidth <= 0)
    return
  // If fitty was initialized while the element was hidden (e.g. on a
  // preloaded slide), its internal state is invalid and refitting can
  // never recover, so reinitialize it once the container is visible.
  // A successful fit always leaves an inline font-size on the element.
  if (inner.value && !inner.value.style.fontSize)
    init()
  else
    instance?.fit()
})
</script>

<template>
  <div ref="container" class="slidev-auto-fit-text">
    <div ref="inner" class="slidev-auto-fit-text-inner">
      <slot>
        {{ value }}
      </slot>
    </div>
  </div>
</template>

<style scoped>
.slidev-auto-fit-text {
  overflow: auto;
}

.slidev-auto-fit-text-inner {
  display: inline-block;
  white-space: nowrap;
}
</style>
