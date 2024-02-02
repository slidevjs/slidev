<script setup lang="ts">
import { showcases } from '../../showcases'
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <ShowCaseInfo v-for="(info, idx) of showcases" :key="idx" :info="info" />
  </div>
</template>
