<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import VPMenuGroup from 'vitepress/dist/client/theme-default/components/VPMenuGroup.vue'
import { computed } from 'vue'
import { data as features } from '../../../features/index.data.js'

const props = defineProps<{
  name: string
  links?: (string | Record<string, string>)[]
}>()

const items = computed<DefaultTheme.NavItemWithLink[]>(() => {
  return props.links?.map((link) => {
    if (typeof link === 'string') {
      const [kind, name] = link.split('/')
      switch (kind) {
        case 'features': {
          const feature = features[name]
          if (!feature)
            throw new Error(`Feature "${name}" not found.`)
          return { text: feature.title, link: feature.link }
        }
        default:
          throw new Error(`Invalid link: ${link}`)
      }
    }
    else {
      const textAndLink = Object.entries(link)[0]
      if (!textAndLink)
        throw new Error(`Invalid link object: ${JSON.stringify(link)}`)
      return { text: textAndLink[0], link: textAndLink[1] }
    }
  }) ?? []
})
</script>

<template>
  <VPMenuGroup v-if="items?.length" :text="name" :items />
</template>
