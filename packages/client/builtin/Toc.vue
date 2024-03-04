<!--
Table Of content

`mode` can be either 'all', 'onlyCurrentTree' or 'onlySiblings'

Usage:

<Toc columns='2' maxDepth='3' mode='onlySiblings'/>
-->
<script setup lang='ts'>
import { computed } from 'vue'
import type { TocItem } from '@slidev/types'
import { useSlideContext } from '../context'

const props = withDefaults(
  defineProps<{
    columns?: string | number
    listClass?: string | string[]
    start?: string | number
    listStyle?: string | string[]
    maxDepth?: string | number
    minDepth?: string | number
    mode?: 'all' | 'onlyCurrentTree' | 'onlySiblings'
  }>(),
  {
    columns: 1,
    listClass: '',
    start: 1,
    listStyle: '',
    maxDepth: Number.POSITIVE_INFINITY,
    minDepth: 1,
    mode: 'all',
  },
)

const { $slidev } = useSlideContext()

function filterTreeDepth(tree: TocItem[], level = 1): TocItem[] {
  if (level > Number(props.maxDepth)) {
    return []
  }
  else if (level < Number(props.minDepth)) {
    const activeItem = tree.find((item: TocItem) => item.active || item.activeParent)
    return activeItem ? filterTreeDepth(activeItem.children, level + 1) : []
  }
  return tree
    .map((item: TocItem) => ({
      ...item,
      children: filterTreeDepth(item.children, level + 1),
    }))
}

function filterOnlyCurrentTree(tree: TocItem[]): TocItem[] {
  return tree
    .filter(
      (item: TocItem) => item.active || item.activeParent || item.hasActiveParent,
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
  const tree = $slidev?.nav.tocTree
  if (!tree)
    return []
  let tocTree = filterTreeDepth(tree)
  if (props.mode === 'onlyCurrentTree')
    tocTree = filterOnlyCurrentTree(tocTree)
  else if (props.mode === 'onlySiblings')
    tocTree = filterOnlySiblings(tocTree)
  return tocTree
})
</script>

<template>
  <div class="slidev-toc" :style="`column-count:${columns}`">
    <TocList
      :level="1"
      :start="start"
      :list-style="listStyle"
      :list="toc"
      :list-class="listClass"
    />
  </div>
</template>
