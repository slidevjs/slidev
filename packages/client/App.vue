<script setup lang="ts">
import { provide } from 'vue'
import Play from './internals/Play.vue'
import { injectClickDisabled } from './modules/directives'
import setupHead from './setup/head'
import { query } from './state'

setupHead()

if (query.print)
  provide(injectClickDisabled, true)
</script>

<template>
  <Play />
</template>
