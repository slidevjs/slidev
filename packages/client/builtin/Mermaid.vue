<!--
Mermaid
(auto transformed, you don't need to use this component directly)

Usage:

```mermaid
pie
"Dogs" : 386
"Cats" : 85
"Rats" : 15
```
-->

<script setup lang="ts">
import { defineProps, computed, getCurrentInstance, onMounted } from 'vue'
import { renderMermaid } from '../modules/mermaid'

const props = defineProps<{
  code: string
  scale?: number
  align?: string
  theme?: string
}>()

const vm = getCurrentInstance()
const svgObj = computed(() => renderMermaid(props.code || '', Object.assign({ theme: props.theme }, vm!.attrs)))
const html = computed(() => { return svgObj.value.html })
onMounted(() => {
  const svgEl = document.getElementById(svgObj.value.id)
  if (props.scale !== 'undefined' && svgEl !== null) {
    svgEl.setAttribute('width', 'auto')
    svgEl.setAttribute('height', svgEl.getAttribute('height') * props.scale)
  }
})
</script>

<template>
  <div class="mermaid" v-html="html"></div>
</template>
