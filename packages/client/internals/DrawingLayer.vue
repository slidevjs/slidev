<script setup lang="ts">
import { onMounted, ref, watch, inject, onBeforeUnmount } from 'vue'
import { ignorableWatch } from '@vueuse/core'
import { drawingEnabled, drauu, drauuData } from '../logic/drawings'
import { injectionSlideScale } from '../constants'
import { currentPage } from '../logic/nav'

const scale = inject(injectionSlideScale)!
const svg = ref<SVGSVGElement>()

onMounted(() => {
  let skipNext = false
  drauu.mount(svg.value!)
  watch(scale, scale => drauu.options.corrdinateScale = 1 / scale, { immediate: true })

  const { ignoreUpdates } = ignorableWatch(
    drauuData,
    () => {
      const data = drauuData.value[currentPage.value]
      if (data != null)
        drauu.load(data)
    },
    { deep: true },
  )

  drauu.on('changed', () => {
    if (skipNext) {
      skipNext = false
      return
    }
    ignoreUpdates(() => {
      drauuData.value[currentPage.value] = drauu.dump()
    })
  })

  watch(currentPage, (page) => {
    skipNext = true
    const data = drauuData.value[page]
    if (data)
      drauu.load(data)
    else
      drauu.clear()
  })
})

onBeforeUnmount(() => {
  drauu.unmount()
})
</script>

<template>
  <svg
    ref="svg"
    class="w-full h-full absolute top-0"
    :class="{ 'pointer-events-none': !drawingEnabled }"
  ></svg>
</template>
