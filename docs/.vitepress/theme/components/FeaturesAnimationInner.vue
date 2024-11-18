<script setup lang="ts">
import type { Feature } from '../../../features/index.data'
import { withBase } from 'vitepress'
import { computed, ref } from 'vue'
import { data as features } from '../../../features/index.data'

const rows = 6
const offsetMap = Array.from({ length: rows }, () => Math.floor(Math.random() * 200))
const featuresArr = Object.values(features) as Feature[]
const groupedFeatures = computed(() => {
  const res: Feature[][] = Array.from({ length: rows }, () => [])
  for (let i = 0; i < featuresArr.length; i++) {
    res[i % rows].push(featuresArr[i])
  }
  return res
})

const round = ref(0)
</script>

<template>
  <div class="relative w-full x-6 overflow-auto">
    <div class="flex flex-col gap-4 ml--50">
      <div v-for="group, i in groupedFeatures" :key="i" class="flex gap-4">
        <div :style="{ minWidth: `${offsetMap[i]}px` }" />
        <template v-for="r in [round, round + 1, round + 2]" :key="r">
          <a
            v-for="feature, j in group" :key="j" :href="withBase(feature.link)"
            class="px-3 py-2 rounded bg-$vp-c-bg-elv min-w-max !decoration-none"
          >
            {{ feature.title }}
          </a>
        </template>
      </div>
    </div>
    <div class="absolute left-0 top-0 bottom-0 w-10 backdrop-blur" />
  </div>
</template>
