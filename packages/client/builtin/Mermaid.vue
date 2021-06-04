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
import { defineProps, computed, getCurrentInstance } from 'vue'
import { renderMermaid } from '../modules/mermaid'

const props = defineProps<{
  code: string
  scale?: number
  align?: string
  theme?: string
}>()

const vm = getCurrentInstance()
const html = computed(() => renderMermaid(props.code || '', Object.assign({ theme: props.theme }, vm!.attrs)))
</script>

<template>
  <Transform :scale="scale || 1" :origin="'top ' + align || 'top left'">
    <div class="mermaid" v-html="html"></div>
  </Transform>
</template>
