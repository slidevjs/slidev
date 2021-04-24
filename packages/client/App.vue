<script setup lang="ts">
import { provide } from 'vue'
import { injectClickDisabled } from './modules/directives'
import setupApp from './setup/app'
import { isPrintMode } from './state'

setupApp()

if (isPrintMode.value)
  provide(injectClickDisabled, true)
</script>

<template>
  <RouterView />
</template>
