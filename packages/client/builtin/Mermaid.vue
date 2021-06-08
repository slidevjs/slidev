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
import { defineProps, computed, getCurrentInstance, ref, watch, watchEffect } from 'vue'
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
const actuallHeight = ref<number>()

watch(html, () => {
  actuallHeight.value = undefined
})

watchEffect(() => {
  const svgEl = el.value?.children?.[0] as SVGElement | undefined
  if (svgEl && svgEl.hasAttribute('width') && actuallHeight.value == null) {
    const v = parseFloat(svgEl.getAttribute('height') || '')
    actuallHeight.value = isNaN(v) ? undefined : v
  }
}, { flush: 'post' })

watchEffect(() => {
  const svgEl = el.value?.children?.[0] as SVGElement | undefined
  if (svgEl != null && props.scale != null && actuallHeight.value != null) {
    svgEl.setAttribute('height', `${actuallHeight.value * props.scale}`)
    svgEl.removeAttribute('width')
    svgEl.removeAttribute('style')
  }
}, { flush: 'post' })
</script>

<template>
  <div ref="el" class="mermaid" v-html="html"></div>
</template>
