<!--
Table Of content

`mode` can be either 'all', 'onlyCurrentTree' or 'onlySiblings'

Usage:

<Toc columns='2' maxDepth='3' mode='onlySiblings'/>
-->
<script setup lang='ts'>
import { computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { currentRoute, rawRoutes } from '../logic/nav'
import type { TocItem } from './TocList.vue'

const props = withDefaults(
  defineProps<{
    columns?: string | number
    maxDepth?: string | number
    minDepth?: string | number
    mode?: 'all' | 'onlyCurrentTree' | 'onlySiblings'
  }>(),
  { columns: 1, maxDepth: Infinity, minDepth: 1, mode: 'all' },
)

function makeTree(): TocItem[] {
  return rawRoutes
    .filter((route: RouteRecordRaw) => route.meta?.slide?.title)
    .reduce((acc: TocItem[], route: RouteRecordRaw) => {
      addToTree(acc, route)
      return acc
    }, [])
}

function addToTree(tree: TocItem[], route: RouteRecordRaw, level = 1) {
  const titleLevel = route.meta?.slide?.titleLevel
  if (titleLevel && titleLevel > level && tree.length > 0) {
    addToTree(tree[tree.length - 1].children, route, level + 1)
  }
  else {
    tree.push({
      children: [],
      level,
      path: route.path,
      skipInToc: Boolean(route.meta?.skipInToc),
      title: route.meta?.slide?.title,
    })
  }
}

function addActiveStatuses(
  tree: TocItem[],
  hasActiveParent = false,
  parent?: TocItem,
) {
  tree.forEach((item: TocItem) => {
    item.active = item.path === currentRoute.value?.path
    item.hasActiveParent = hasActiveParent
    if (item.children.length > 0)
      addActiveStatuses(item.children, item.active || item.hasActiveParent, item)
    if (parent && (item.active || item.activeParent))
      parent.activeParent = true
  })
}

function filterTree(tree: TocItem[], level = 1): TocItem[] {
  if (level > Number(props.maxDepth)) {
    return []
  }
  else if (level < Number(props.minDepth)) {
    const activeItem = tree.find((item: TocItem) => item.active || item.activeParent)
    return activeItem ? filterTree(activeItem.children, level + 1) : []
  }
  return tree
    .filter((item: TocItem) => !item.skipInToc)
    .map((item: TocItem) => ({
      ...item,
      children: filterTree(item.children, level + 1),
    }))
}

function filterOnlyCurrentTree(tree: TocItem[]): TocItem[] {
  return tree
    .filter(
      (item: TocItem) =>
        item.active || item.activeParent || item.hasActiveParent,
    )
    .map((item: TocItem) => ({
      ...item,
      children: filterOnlyCurrentTree(item.children),
    }))
}

function filterOnlySiblings(tree: TocItem[]): TocItem[] {
  const treehasActiveItem = tree.some(
    (item: TocItem) => item.active || item.activeParent || item.hasActiveParent,
  )
  return tree
    .filter(() => treehasActiveItem)
    .map((item: TocItem) => ({
      ...item,
      children: filterOnlySiblings(item.children),
    }))
}

const toc = computed(() => {
  let tree = makeTree()
  addActiveStatuses(tree)
  tree = filterTree(tree)
  if (props.mode === 'onlyCurrentTree')
    tree = filterOnlyCurrentTree(tree)
  else if (props.mode === 'onlySiblings')
    tree = filterOnlySiblings(tree)
  return tree
})
</script>

<template>
  <div :style="{ columnCount: columns }">
    <toc-list :level="1" :list="toc" />
  </div>
</template>
