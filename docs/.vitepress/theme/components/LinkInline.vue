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
      <div flex>
        <div text-lg>
          {{ resolved.title }}
        </div>
        <div flex-grow />
        <div flex gap-1>
          <FeatureTag v-for="tag in resolved.tags" :key="tag" :tag />
        </div>
      </div>
      <div mt-1>
        {{ resolved.descripton }}
      </div>
    </template>
  </Tooltip>
</template>
