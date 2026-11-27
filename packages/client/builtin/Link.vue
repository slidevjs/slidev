<!--
Create a link in the presentation

Usage:

<Link :to="5" >Go to slide 5</Link>

<Link :to="5" title="Go to slide 5" />
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useNav } from '../composables/useNav'
import { getPrintSlideAnchorId } from '../logic/slidePath'
import { getSlide } from '../logic/slides'

const props = defineProps<{
  to: number | string
  title?: string
}>()

const { isPrintMode } = useNav()

const printHref = computed(() => `#${getPrintSlideAnchorId(getSlide(props.to)?.no ?? props.to)}`)
</script>

<template>
  <RouterLink v-if="!isPrintMode && title" :to="String(to)" @click="($event.target as HTMLElement)?.blur()" v-html="title" />
  <RouterLink v-else-if="!isPrintMode && !title" :to="String(to)" @click="($event.target as HTMLElement)?.blur()">
    <slot />
  </RouterLink>
  <a v-else-if="isPrintMode && title" :href="printHref" v-html="title" />
  <a v-else :href="printHref"><slot /></a>
</template>
