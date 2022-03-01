<!--
TOC list
(used by Toc component, you don't need to use this component directly)

Usage:

<TocList :list="list"/>
-->
<script setup lang="ts">
import type { TocItem } from '../logic/nav'
import { router } from '../routes'

withDefaults(defineProps<{
  level: number
  list: TocItem[]
  mode?: 'ul' | 'span'
  dots?: string
}>(), { level: 1, mode: 'ul', dots: '●○◌◡.' })
</script>

<template>
  <ul v-if="mode === 'ul' && list && list.length > 0" :class="['slidev-toc-list', `slidev-toc-list-level-${level}`]">
    <li v-for="item in list" :key="item.path" :class="['slidev-toc-item', {'slidev-toc-item-active': item.active}, {'slidev-toc-item-parent-active': item.activeParent}]">
      <RouterLink :to="item.path" v-html="item.title" />
      <TocList :level="level + 1" :list="item.children" />
    </li>
  </ul>
  <template v-if="mode === 'span' && list && list.length > 0">
    <template v-for="item in list" :key="item.path">
      <a :class="{dot: true, active: item.active}" @click="router.push({ path: item.path })">
        {{ dots[Math.min(level, dots.length) - 1] }}
      </a>
      <TocList :level="level + 1" :list="item.children" :mode="mode" :dots="dots" />
    </template>
  </template>
</template>
