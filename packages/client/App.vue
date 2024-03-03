<script setup lang="ts">
import { watchEffect } from 'vue'
import { themeVars } from './env'
import setupRoot from './setup/root'

setupRoot()

watchEffect(() => {
  for (const [key, value] of Object.entries(themeVars.value))
    document.body.style.setProperty(key, value.toString())
})
</script>

<template>
  <RouterView />
</template>
