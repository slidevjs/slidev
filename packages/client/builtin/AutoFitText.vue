<!--
[Experimental]

Think this component as the TextBox you that will see
in PowerPoint or Keynote. It will automatically resize
the font size based on it's content to fit them in.

Usage:

<AutoFitText modelValue="text"/>

or

<AutoFitText :max="80" :min="100" v-model="text"/>
-->

<script setup lang="ts">
import { useElementSize, useVModel } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

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
})

const emit = defineEmits<{
  (e: any): void
}>()
const container = ref<HTMLDivElement>()
const inner = ref<HTMLDivElement>()
const size = ref(100)
const fontSize = computed(() => `${size.value}px`)
const value = useVModel(props, 'modelValue', emit)

const containerSize = useElementSize(container)
const innerSize = useElementSize(inner)

const wrapLen = ref(0)
const wrap = ref('nowrap')

watch([container, value, containerSize.width, innerSize.width], async () => {
  if (!container.value || innerSize.width.value <= 0)
    return
  const ratio = containerSize.width.value / innerSize.width.value
  if (Number.isNaN(ratio) || ratio <= 0)
    return
  let newSize = size.value * (containerSize.width.value / innerSize.width.value)
  if (newSize < props.min) {
    wrapLen.value = value.value.length
    wrap.value = ''
  }
  else {
    if (value.value.length < wrapLen.value)
      wrap.value = 'nowrap'
  }
  newSize = Math.max(props.min, Math.min(props.max, newSize))
  size.value = newSize
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
  font-size: v-bind(fontSize);
  white-space: v-bind(wrap);
}

.slidev-auto-fit-text-inner {
  display: inline-block;
}
</style>
