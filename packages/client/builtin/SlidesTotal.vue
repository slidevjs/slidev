<script setup lang="ts">
import { inject } from 'vue'
import { injectionSlidevContext } from '../constants'

const $slidev = inject(injectionSlidevContext)
</script>

<template>
  <span>{{ $slidev.nav.total }}</span>
</template>
