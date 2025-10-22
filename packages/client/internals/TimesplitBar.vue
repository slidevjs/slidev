<script setup lang="ts">
import { parseTimesplits } from '@slidev/parser/utils'
import { computed } from 'vue'
import { useNav } from '../composables/useNav'
// import { useTimer } from '../composables/useTimer'

const { slides } = useNav()

// const timer = useTimer()
const slidesWithTimesplits = computed(() => slides.value.filter(i => i.meta.slide?.frontmatter.timesplit))

const timesplits = computed(() => {
  const parsed = parseTimesplits(
    slidesWithTimesplits.value
      .map(i => ({ no: i.no, timesplit: i.meta.slide?.frontmatter.timesplit as string })),
  )
  return parsed
})
</script>

<template>
  <div v-if="false" class="border-b border-main relative flex">
    {{ timesplits }}
  </div>
</template>
