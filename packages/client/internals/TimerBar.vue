<script setup lang="ts">
// import { parseTimesplits } from '@slidev/parser/utils'
import { computed, reactive } from 'vue'
// import { useNav } from '../composables/useNav'
import { useTimer } from '../composables/useTimer'

// const { slides } = useNav()

const timer = reactive(useTimer())
// TODO: timesplit
// const slidesWithTimesplits = computed(() => slides.value.filter(i => i.meta.slide?.frontmatter.timesplit))

// const _timesplits = computed(() => {
//   const parsed = parseTimesplits(
//     slidesWithTimesplits.value
//       .map(i => ({ no: i.no, timesplit: i.meta.slide?.frontmatter.timesplit as string })),
//   )
//   return parsed
// })

// TODO: maybe make it configurable, or somehow more smart
const color = computed(() => {
  if (timer.status === 'stopped')
    return 'op50'
  if (timer.status === 'paused')
    return 'bg-blue'

  if (timer.percentage > 80)
    return 'bg-yellow'
  else if (timer.percentage > 100)
    return 'bg-red'
  else
    return 'bg-green'
})
</script>

<template>
  <div
    class="border-b mt-px border-main relative flex h-4px"
  >
    <div
      v-if="timer.status !== 'stopped'"
      class="h-4px"
      :class="color"
      :style="{ width: `${timer.percentage}%` }"
    />
    <!-- {{ timesplits }} -->
  </div>
</template>
