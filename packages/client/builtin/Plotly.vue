<!--
Wrapper for embedded plotly charts - export your chart from chart-studio

WARNING: Layout of page must be set to none, charts only work in fullscreen mode reliably

Usage:
<Plotly link="//plotly.com/~jorekai/3.embed"/>
-->

<script setup lang="ts">
import { defineProps } from 'vue'
defineProps<{
  link: string // plotly link for chart
  width?: number
  height?: number
}>()
</script>

<template>
  <iframe
    title="Plotly"
    :width="width || `100%`"
    :height="height || `100%`"
    style="position: absolute"
    frameborder="0"
    scrolling="no"
    :src="link + '?modebar=false&link=false'"
    allowfullscreen
  ></iframe>
</template>
