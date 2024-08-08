<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client/context'

const props = defineProps<{ no?: number | string }>()
const { $page } = useSlideContext()
const no = computed(() => +(props.no ?? $page.value))
</script>

<template>
  Title {{ no }}
</template>
