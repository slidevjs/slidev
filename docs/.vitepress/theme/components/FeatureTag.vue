<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'

const props = defineProps<{
  tag: string
  removable?: boolean
  noclick?: boolean
}>()
const emit = defineEmits(['remove'])

const { isDark } = useData()

function getHashColorFromString(
  name: string,
  opacity: number | string = 1,
) {
  name += 'salt'
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const h = hash % 360
  return getHsla(h, opacity)
}

function getHsla(
  hue: number,
  opacity: number | string = 1,
) {
  const saturation = isDark.value ? 50 : 65
  const lightness = isDark.value ? 60 : 40
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`
}

const formattedTag = computed(() => {
  const tag = props.tag
    .replace(/\b(API|CLI)\b/gi, m => m.toUpperCase())
    .replace(/-/g, ' ')
  return tag[0].toUpperCase() + tag.slice(1)
})

const colors = computed(() => {
  return [
    getHashColorFromString(props.tag),
    getHashColorFromString(props.tag, 0.7),
    getHashColorFromString(props.tag, 0.5),
    getHashColorFromString(props.tag, 0.2),
    getHashColorFromString(props.tag, 0.1),
  ]
})
</script>

<template>
  <a v-if="props.removable" class="feature-tag flex gap-1 items-center">
    {{ formattedTag }}
    <button class="flex items-center op-70 hover:bg-gray-200/20 hover:op90 rounded-full mr--1" @click="emit('remove')">
      <carbon:close />
    </button>
  </a>
  <span v-else-if="props.noclick" class="feature-tag">
    {{ formattedTag }}
  </span>
  <a v-else class="feature-tag" :href="withBase(`/features/#tags=${tag}`)" target="_blank">
    {{ formattedTag }}
  </a>
</template>

<style scoped>
.feature-tag {
  --uno: 'text-sm px-2 py-.5 rounded-md select-none !decoration-none border border-solid h-max';
  background-color: v-bind('colors[4]');
  color: v-bind('colors[0]') !important;
  border-color: v-bind('colors[3]');
}

.feature-tag:hover {
  background-color: v-bind('colors[3]');
}
</style>
