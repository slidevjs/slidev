<script setup lang="ts">
import { provide } from 'vue'
import { injectClickDisabled } from './modules/directives'
import Play from './internals/Play.vue'
import setupHead from './setup/main'
import { isPrintMode } from './state'

setupHead()

if (isPrintMode)
  provide(injectClickDisabled, true)
</script>

<template>
  <Play />
</template>
