<script setup lang="ts">
import { useData } from 'vitepress'

defineProps<{
  tags: string[]
}>()

const { isDark } = useData()

function tagToColor(tag: string) {
  const color = [0, 0, 0]
  for (let i = 0; i < tag.length; i++) {
    color[i % 3] += tag.charCodeAt(i) - 'a'.charCodeAt(0)
  }
  for (let i = 0; i < 3; i++) {
    const t = (color[i] * 10) % 100
    color[i] = isDark.value ? t : 155 + t
  }
  return `rgb(${color.join(',')})`
}
</script>

<template>
  <div v-if="tags.length" class="VPMenuGroup">
    <p class="title">
      Tags
    </p>

    <div pl-3 mt-1>
      <span v-for="tag in tags" :key="tag" class="tag" :style="{ backgroundColor: tagToColor(tag) }">
        {{ tag }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.VPMenuGroup {
  margin: 12px -12px 0;
  border-top: 1px solid var(--vp-c-divider);
  padding: 12px 12px 0;
}

.VPMenuGroup:first-child {
  margin-top: 0;
  border-top: 0;
  padding-top: 0;
}

.VPMenuGroup + .VPMenuGroup {
  margin-top: 12px;
  border-top: 1px solid var(--vp-c-divider);
}

.title {
  padding: 0 12px;
  line-height: 32px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  transition: color 0.25s;
}

.tag {
  --uno: text-sm px-2 pb-1 pt-.5 rounded-full;
}
</style>
