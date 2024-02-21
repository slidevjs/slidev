<script setup lang="ts">
import { useSlideContext } from '../context'

const { $page } = useSlideContext()
</script>

<template>
  <span>{{ $page }}</span>
</template>
