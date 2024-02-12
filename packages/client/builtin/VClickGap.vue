<script setup lang="ts">
import { Fragment, inject, onMounted, watchEffect } from 'vue'
import { injectionClicksContext } from '../constants'
import { makeId } from '../logic/utils'

const props = defineProps({
  size: {
    type: [String, Number],
    default: 1,
  },
})

const clicksRef = inject(injectionClicksContext)

onMounted(() => {
  watchEffect((onCleanup) => {
    const clicks = clicksRef?.value

    if (!clicks || clicks.disabled)
      return

    let relativeDelta = +props.size
    if (Number.isNaN(relativeDelta)) {
      console.warn(`[slidev] Invalid size for VClickGap: ${props.size}`)
      relativeDelta = 1
    }
    const max = clicks.currentOffset + relativeDelta - 1

    const id = makeId()
    clicks.register(id, { max, relativeDelta })
    onCleanup(() => clicks.unregister(id))
  })
})
</script>

<template>
  <Fragment />
</template>
