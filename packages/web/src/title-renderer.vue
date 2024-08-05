<script setup lang="ts">
import { useSlideContext } from '@slidev/client/context.ts'
import { computed } from 'vue'

const props = defineProps<{ no?: number | string }>()
const { $page } = useSlideContext()
const no = computed(() => +(props.no ?? $page.value))
</script>

<template>
  Title {{ no }}
</template>
