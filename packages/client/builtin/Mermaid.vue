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
import { computed, getCurrentInstance, ref, watch, watchEffect } from 'vue'
import { renderMermaid } from '../modules/mermaid'
import ShadowRoot from '../internals/ShadowRoot.vue'
import { isDark } from '../logic/dark'

const props = defineProps<{
  code: string
  scale?: number
  theme?: string
}>()

const vm = getCurrentInstance()
const el = ref<HTMLDivElement>()
const svgObj = computed(() => renderMermaid(
  props.code || '',
  {
    theme: props.theme || (isDark.value ? 'dark' : undefined),
    ...vm!.attrs,
  },
))
const html = computed(() => svgObj.value)
const actualHeight = ref<number>()

watch(html, () => {
  actualHeight.value = undefined
})

watchEffect(() => {
  const svgEl = el.value?.children?.[0] as SVGElement | undefined
  if (svgEl && svgEl.hasAttribute('viewBox') && actualHeight.value == null) {
    const v = parseFloat(svgEl.getAttribute('viewBox')?.split(' ')[3] || '')
    actualHeight.value = isNaN(v) ? undefined : v
  }
}, { flush: 'post' })

watchEffect(() => {
  const svgEl = el.value?.children?.[0] as SVGElement | undefined
  if (svgEl != null && props.scale != null && actualHeight.value != null) {
    svgEl.setAttribute('height', `${actualHeight.value * props.scale}`)
    svgEl.removeAttribute('width')
    svgEl.removeAttribute('style')
  }
}, { flush: 'post' })
</script>

<template>
  <ShadowRoot ref="el" class="mermaid" :inner-html="html" @shadow="el = $event" />
</template>
