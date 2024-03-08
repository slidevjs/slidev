<!--
Create a link in the presentation

Usage:

<Link :to="5" >Go to slide 5</Link>

<Link :to="5" title="Go to slide 5" />
-->
<script setup lang="ts">
import { useNav } from '../composables/useNav'

defineProps<{
  to: number | string
  title?: string
}>()

const { isPrintMode } = useNav()
</script>

<template>
  <RouterLink v-if="!isPrintMode && title" :to="String(to)" @click="$event.target.blur()" v-html="title" />
  <RouterLink v-else-if="!isPrintMode && !title" :to="String(to)" @click="$event.target.blur()">
    <slot />
  </RouterLink>
  <a v-else-if="isPrintMode && title" :href="`#${to}`" v-html="title" />
  <a v-else :href="`#${to}`"><slot /></a>
</template>
