<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const props = defineProps<{
  tag: string
  removable: boolean
}>()
const emit = defineEmits(['remove'])

const { isDark } = useData()

const bgColor = computed(() => {
  const color = [0, 0, 0]
  for (let i = 0; i < props.tag.length; i++) {
    color[i % 3] += props.tag.charCodeAt(i) - 'a'.charCodeAt(0)
  }
  for (let i = 0; i < 3; i++) {
    const t = (color[i] * 10) % 55
    color[i] = isDark.value ? 50 + t : 200 + t
  }
  return [`rgb(${color.join(',')})`, `rgba(${color.join(',')}, 0.5)`]
})
</script>

<template>
  <a v-if="props.removable" class="feature-tag flex gap-1 items-center">
    {{ tag }}
    <button class="flex items-center op-70 hover:bg-gray-200/20 hover:op90 rounded-full" @click="emit('remove')">
      <carbon:close />
    </button>
  </a>
  <a v-else class="feature-tag normal" :href="withBase(`/features/#tags=${tag}`)">
    {{ tag }}
  </a>
</template>

<style scoped>
.feature-tag {
  @apply text-sm px-2 py-.5 rounded-full select-none !text-$vp-c-text-1 !decoration-none;
  background-color: v-bind('bgColor[0]');
}

.feature-tag.normal:hover {
  background-color: v-bind('bgColor[1]');
}
</style>
