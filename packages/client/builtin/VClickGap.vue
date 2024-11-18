<script setup lang="ts">
import { Fragment, onMounted, onUnmounted } from 'vue'
import { useSlideContext } from '../context'
import { makeId } from '../logic/utils'

const props = defineProps({
  size: {
    type: [String, Number],
    default: 1,
  },
})

const { $clicksContext: clicks } = useSlideContext()
const id = makeId()

let delta = +props.size
if (Number.isNaN(delta)) {
  console.warn(`[slidev] Invalid size for VClickGap: ${props.size}`)
  delta = 1
}

onMounted(() => {
  const max = clicks.currentOffset + delta - 1
  clicks.register(id, { max, delta })
})

onUnmounted(() => {
  clicks.unregister(id)
})
</script>

<template>
  <Fragment />
</template>
