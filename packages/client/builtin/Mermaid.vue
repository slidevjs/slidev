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
import { defineProps, computed } from 'vue'
import { renderMermaid } from '../modules/mermaid'

const props = defineProps({
  code: {
    default: '',
  },
  scale: {
    default: 1,
  },
  theme: {
    default: 'base',
  },
})

const html = computed(() => renderMermaid(props.code))
</script>

<template>
  <Transform :scale="scale">
    <div v-html="html"></div>
  </Transform>
</template>
