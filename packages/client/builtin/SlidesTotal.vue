<script setup lang="ts">
import { useSlideContext } from '../context'

const { $nav } = useSlideContext()
</script>

<template>
  <span>{{ $nav.total }}</span>
</template>
