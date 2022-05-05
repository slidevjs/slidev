<!--
PlantUML
(auto transformed, you don't need to use this component directly)

Usage:

```plantuml
@startuml
Alice -> Bob : Hello!
@enduml
```
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  code: string
  server: string
  scale?: number
}>()

const uri = computed(() => `${props.server}/svg/${props.code}`)
</script>

<template>
  <img alt="PlantUML diagram" :src="uri" :style="{ scale }">
</template>
