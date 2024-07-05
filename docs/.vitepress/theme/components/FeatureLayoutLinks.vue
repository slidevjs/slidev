<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import VPMenuGroup from 'vitepress/dist/client/theme-default/components/VPMenuGroup.vue'
import { computed } from 'vue'
import { data as features } from '../../../features/index.data.js'
import { data as guides } from '../../guides.js'

const props = defineProps<{
  name: string
  links?: (string | Record<string, string>)[]
}>()

function removeHash(link: string) {
  const idx = link.lastIndexOf('#')
  return idx < 0 ? link : link.slice(0, idx)
}

function getGuideTitle(id: string) {
  return guides.find(g => g.link.endsWith(id))?.text ?? id
}

const items = computed<DefaultTheme.NavItemWithLink[]>(() => {
  return props.links?.map((link) => {
    if (typeof link === 'string') {
      const [kind, nameWithHash] = link.split('/')
      const name = removeHash(nameWithHash)
      switch (kind) {
        case 'feature': {
          const feature = features[name]
          if (!feature)
            throw new Error(`Feature "${name}" not found.`)
          return { text: `✨ ${feature.title}`, link: `/features/${nameWithHash}`, target: '_blank' }
        }
        case 'guide': {
          return { text: `📘 ${getGuideTitle(name)}`, link: `/guide/${nameWithHash}`, target: '_blank' }
        }
        default:
          throw new Error(`Invalid link: ${link}`)
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
