<script setup lang="ts">
import { inject } from 'vue'
import { injectionCurrentPage } from '../constants'

const $page = inject(injectionCurrentPage)
</script>

<template>
  <span>{{ $page }}</span>
</template>
