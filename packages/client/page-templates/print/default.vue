<script setup lang="ts">
import { provideLocal } from '@vueuse/core'
import { computed } from 'vue'
import { injectionSlideScale } from '../../constants'
import { useNav } from '../../composables/useNav'
import { usePrintStyle } from '../../composables/usePrintStyle'
import PrintSlide from '../../internals/PrintSlide.vue'

provideLocal(injectionSlideScale, computed(() => 1))

usePrintStyle()

const { slidesToPrint } = useNav()
</script>

<template>
  <div>
    <PrintSlide v-for="route of slidesToPrint" :key="route.no" :route="route" />
    <slot name="floating" />
  </div>
</template>
