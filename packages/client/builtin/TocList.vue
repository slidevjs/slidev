<!--
TOC list
(used by Toc component, you don't need to use this component directly)

Usage:

<TocList :list="list"/>
-->
<script setup lang="ts">
import type { TocItem } from '../logic/nav'

withDefaults(defineProps<{
  level: number
  list: TocItem[]
}>(), { level: 1 })
</script>

<template>
  <ul v-if="list && list.length > 0" :class="['slidev-toc-list', `slidev-toc-list-level-${level}`]">
    <li v-for="item in list" :key="item.path" :class="['slidev-toc-item', {'slidev-toc-item-active': item.active}, {'slidev-toc-item-parent-active': item.activeParent}]">
      <RouterLink :to="item.path" v-html="item.title" />
      <TocList :level="level + 1" :list="item.children" />
    </li>
  </ul>
</template>
