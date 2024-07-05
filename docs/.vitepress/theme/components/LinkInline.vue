<script setup lang="ts">
import { withBase } from 'vitepress'
import { Tooltip } from 'floating-vue'
import { computed } from 'vue'
import { resolveLink } from '../../utils'

const props = defineProps<{
  link: string
}>()

const resolved = computed(() => resolveLink(props.link))
</script>

<template>
  <Tooltip class="inline-block">
    <a :href="withBase(resolved.url)">
      {{ resolved.title }}
    </a>

    <template #popper>
      {{ resolved.descripton }}
    </template>
  </Tooltip>
</template>
