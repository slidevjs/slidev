<script setup lang="ts">
import { Fragment, onMounted, watchEffect } from 'vue'
import { makeId } from '../logic/utils'
import { useSlideContext } from '../context'

const props = defineProps({
  size: {
    type: [String, Number],
    default: 1,
  },
})

const { $clicksContext: clicks } = useSlideContext()

onMounted(() => {
  watchEffect((onCleanup) => {
    if (!clicks)
      return

    let delta = +props.size
    if (Number.isNaN(delta)) {
      console.warn(`[slidev] Invalid size for VClickGap: ${props.size}`)
      delta = 1
    }
    const max = clicks.currentOffset + delta - 1

    const id = makeId()
    clicks.register(id, { max, delta })
    onCleanup(() => clicks.unregister(id))
  })
})
</script>

<template>
  <Fragment />
</template>
