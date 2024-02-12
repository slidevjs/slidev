<script setup lang="ts">
import { Fragment, inject, onMounted, watchEffect } from 'vue'
import { injectionClicksContext } from '../constants'
import { makeId, safeParseNumber } from '../logic/utils'

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

    const flowSize = safeParseNumber(props.size)
    const max = clicks.flowSum + flowSize - 1

    const id = makeId()
    clicks.register(id, { max, flowSize })
    onCleanup(() => clicks.unregister(id))
  })
})
</script>

<template>
  <Fragment />
</template>
