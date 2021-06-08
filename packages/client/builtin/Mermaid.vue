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
import { defineProps, computed, getCurrentInstance, ref, onMounted } from 'vue'
import { renderMermaid } from '../modules/mermaid'

const props = defineProps<{
  code: string
  scale?: number
  theme?: string
}>()

const vm = getCurrentInstance()
const el = ref<HTMLDivElement>()
const svgObj = computed(() => renderMermaid(props.code || '', Object.assign({ theme: props.theme }, vm!.attrs)))
const html = computed(() => svgObj.value)

onMounted(() => {
  const svgEl = el.value?.children?.[0] as SVGElement | undefined
  if (svgEl != null && props.scale != null) {
    const height = +svgEl.getAttribute('height')!
    svgEl.setAttribute('width', 'auto')
    svgEl.setAttribute('height', `${height * props.scale}`)
  }
})
</script>

<template>
  <div ref="el" class="mermaid" v-html="html"></div>
</template>
