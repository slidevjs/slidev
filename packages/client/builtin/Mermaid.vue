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
import { getCurrentInstance, ref, watch, watchEffect } from 'vue'
import ShadowRoot from '../internals/ShadowRoot.vue'
import { isDark } from '../logic/dark'
import { renderMermaid } from '../modules/mermaid'

const props = defineProps<{
  codeLz: string
  scale?: number
  theme?: string
}>()

const vm = getCurrentInstance()
const el = ref<ShadowRoot>()
const error = ref<string | null>(null)
const html = ref('')

watchEffect(async (onCleanup) => {
  let disposed = false
  onCleanup(() => {
    disposed = true
  })
  error.value = null
  try {
    const svg = await renderMermaid(
      props.codeLz || '',
      {
        theme: props.theme || (isDark.value ? 'dark' : undefined),
        ...vm!.attrs,
      },
    )
    if (!disposed)
      html.value = svg
  }
  catch (e) {
    error.value = `${e}`
    console.warn(e)
  }
})

const actualHeight = ref<number>()

watch(html, () => {
  actualHeight.value = undefined
})

watchEffect(() => {
  const svgEl = el.value?.children?.[0] as SVGElement | undefined
  if (svgEl && svgEl.hasAttribute('viewBox') && actualHeight.value == null) {
    const v = Number.parseFloat(svgEl.getAttribute('viewBox')?.split(' ')[3] || '')
    actualHeight.value = Number.isNaN(v) ? undefined : v
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
  <pre v-if="error" border="1 red rounded" class="pa-3 text-wrap">{{ error }}</pre>
  <ShadowRoot v-else class="mermaid" :inner-html="html" @shadow="el = $event" />
</template>
