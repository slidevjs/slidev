<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import VPMenuGroup from 'vitepress/dist/client/theme-default/components/VPMenuGroup.vue'
import { computed } from 'vue'
import { resolveLink } from '../../utils.js'

const props = defineProps<{
  name: string
  links?: (string | Record<string, string>)[]
}>()

const items = computed<DefaultTheme.NavItemWithLink[]>(() => {
  return props.links?.map((link) => {
    if (typeof link === 'string') {
      const resolved = resolveLink(link)
      return {
        text: resolved.title!,
        link: resolved.url,
      }
    }
    else {
      const textAndLink = Object.entries(link)[0]
      if (!textAndLink)
        throw new Error(`Invalid link object: ${JSON.stringify(link)}`)
      return { text: textAndLink[0], link: textAndLink[1], target: '_blank' }
    }
  }) ?? []
})
</script>

<template>
  <VPMenuGroup v-if="items?.length" :text="name" :items />
</template>
