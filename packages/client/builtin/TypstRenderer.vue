<!--
Typst formula renderer component
-->

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { renderTypstFormula } from '../setup/typst'

const props = defineProps({
  formula: {
    type: String,
    required: true,
  },
  displayMode: {
    type: Boolean,
    default: false,
  },
})

const svgContent = ref('')
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    loading.value = true
    svgContent.value = await renderTypstFormula(props.formula, props.displayMode)
    loading.value = false
  }
  catch (e) {
    console.error('Failed to render Typst formula:', e)
    error.value = true
    loading.value = false
  }
})
</script>

<template>
  <div 
    :class="[
      'typst-renderer', 
      { 'typst-display': displayMode, 'typst-inline': !displayMode }
    ]"
  >
    <div v-if="loading" class="typst-loading">Loading...</div>
    <div v-else-if="error" class="typst-error">{{ formula }}</div>
    <div v-else v-html="svgContent" class="typst-content"></div>
  </div>
</template>

<style>
.typst-renderer {
  display: inline-block;
}

.typst-display {
  display: block;
  margin: 1em 0;
  text-align: center;
}

.typst-error {
  color: red;
  font-family: var(--slidev-font-mono);
}

.typst-loading {
  color: #888;
  font-style: italic;
}

.typst-content svg {
  vertical-align: middle;
}
</style>