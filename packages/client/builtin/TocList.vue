<!--
TOC list
(used by Toc component, you don't need to use this component directly)

Usage:

<TocList :list="list"/>
-->
<script setup lang="ts">
import type { TocItem } from '../logic/nav'
import { go } from '../logic/nav'

withDefaults(defineProps<{
  level: number
  list: TocItem[]
}>(), { level: 1 })
</script>

<template>
  <ul v-if="list && list.length > 0" :class="['toc', `toc-level-${level}`]">
    <li v-for="item in list" :key="item.path" :class="['toc-item', {'toc-item-active': item.active}, {'toc-item-parent-active': item.activeParent}]">
      <a @click.prevent="go(item.path)">{{ item.title }}</a>
      <TocList :level="level + 1" :list="item.children" />
    </li>
  </ul>
</template>
