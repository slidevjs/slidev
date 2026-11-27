<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  url: string
  scale?: number
}>()

const scaleInvertPercent = computed(() => `${(1 / (props.scale || 1)) * 100}%`)
</script>

<template>
  <div class="h-full w-full">
    <div relative :style="{ width: scaleInvertPercent, height: scaleInvertPercent }">
      <iframe
        id="frame" class="slidev-layout-iframe"
        :src="url"
        :style="scale ? { '--slidev-iframe-scale': scale } : {}"
      />
    </div>
  </div>
</template>
