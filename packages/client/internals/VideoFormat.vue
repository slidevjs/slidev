<script setup lang="ts">
import { mimeExtMap, mimeType, supportedMimeTypes } from '../logic/recording'
import SelectList from './SelectList.vue'

const mimeTypeItems = supportedMimeTypes.map(mime => ({
  value: mime,
  display: mimeExtMap[mime].toUpperCase(),
}))
</script>

<template>
  <SelectList
    v-if="mimeTypeItems.length"
    v-model="mimeType"
    title="Video Format"
    :items="mimeTypeItems"
  />
</template>
