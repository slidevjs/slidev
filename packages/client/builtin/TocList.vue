<!--
TOC list
(used by Toc component, you don't need to use this component directly)
-->
<script setup lang="ts">
import { go } from '../logic/nav'

export interface TocItem {
  active?: boolean
  activeParent?: boolean
  children: TocItem[]
  hasActiveParent?: boolean
  level: number
  path: string
  skipInToc?: boolean
  title?: string
}

defineProps<{
  level: number
  list: TocItem[]
}>()
</script>

<template>
  <ul v-if="list && list.length > 0" :class="['toc', `toc-level-${level}`]">
    <li v-for="item in list" :key="item.path" :class="['toc-item', {'toc-item-active': item.active}, {'toc-item-parent-active': item.activeParent}]">
      <a @click.prevent="go(item.path)">{{ item.title }}</a>
      <toc-list :level="level + 1" :list="item.children" />
    </li>
  </ul>
</template>
