<!--
TOC list
(used by Toc component, you don't need to use this component directly)

Usage:

<TocList :list="list"/>
-->
<script setup lang="ts">
import { computed } from 'vue'
import { toArray } from '@antfu/utils'
import type { TocItem } from '@slidev/types'
import Titles from '/@slidev/titles.md'

const props = withDefaults(defineProps<{
  level: number
  list: TocItem[]
  listClass?: string | string[]
}>(), { level: 1 })

const classes = computed(() => {
  return [
    ...toArray(props.listClass || []),
    'slidev-toc-list',
    `slidev-toc-list-level-${props.level}`,
  ]
})
</script>

<template>
  <ol v-if="list && list.length > 0" :class="classes">
    <li
      v-for="item of list"
      :key="item.path" class="slidev-toc-item"
      :class="[{ 'slidev-toc-item-active': item.active }, { 'slidev-toc-item-parent-active': item.activeParent }]"
    >
      <Link :to="item.path">
        <Titles :no="item.path" />
      </Link>
      <TocList
        v-if="item.children.length > 0"
        :level="level + 1"
        :list="item.children"
        :list-class="listClass"
      />
    </li>
  </ol>
</template>

<style>
.slidev-layout .slidev-toc-item p {
  margin: 0;
}
.slidev-layout .slidev-toc-item div, .slidev-layout .slidev-toc-item div p {
  display: initial;
}
</style>
