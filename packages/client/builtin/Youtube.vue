<!--
A simple wrapper for embeded YouTube videos

Usage:

<Youtube id="luoMHjh-XcQ" />
-->

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  id: string
  width?: number
  height?: number
}>()
</script>

<template>
  <iframe
    :width="width"
    :height="height"
    :src="`https://www.youtube.com/embed/${id}`"
    title="YouTube"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</template>
