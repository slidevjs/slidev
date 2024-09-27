<script setup lang="ts">
import { Tooltip } from 'floating-vue'
import { withBase } from 'vitepress'
import { computed } from 'vue'
import { resolveLink } from '../../utils'

const props = defineProps<{
  link: string
}>()

const resolved = computed(() => resolveLink(props.link))
</script>

<template>
  <span class="sr-only">{{ resolved.title }}</span>
  <ClientOnly>
    <Tooltip class="inline-block" theme="twoslash">
      <a
        :href="withBase(resolved.url)"
        target="_blank"
        class="bg-$vp-c-default-soft hover:bg-$vp-c-brand-soft rounded px2 py1 !decoration-none"
      >
        {{ resolved.title }}
      </a>

      <template #popper>
        <a
          :href="withBase(resolved.url)"
          target="_blank"
          flex flex-col p4 gap-2 max-w-100
        >
          <div flex gap-2>
            <div>
              {{ resolved.title }}
            </div>
            <div flex-grow />
            <FeatureTag v-for="tag in resolved.tags" :key="tag" :tag :noclick="resolved.kind !== 'features'" text-xs />
          </div>
          <div op75 text-sm>
            {{ resolved.descripton }}
          </div>
        </a>
      </template>
    </Tooltip>
  </ClientOnly>
</template>
