<!--
Table Of content

Usage:

<Toc columns="2" maxDepth="3" mode="onlySiblings"/>
-->
<script lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { defineComponent } from 'vue'
import type { TocItem } from './TocList.vue'

export default defineComponent({
  props: {
    columns: {
      default: 1,
    },
    maxDepth: {
      default: Infinity,
    },
    minDepth: {
      default: 1,
    },
    mode: { // 'all' | 'onlyCurrentTree' | 'onlySiblings'
      type: String,
      default: 'all',
    },
  },
  computed: {
    toc() {
      // console.log(JSON.parse(JSON.stringify(this.$slidev.nav)))
      let tree = this.makeTree()
      this.addActiveStatuses(tree)
      tree = this.filterTree(tree)
      if (this.mode === 'onlyCurrentTree')
        tree = this.filterOnlyCurrentTree(tree)
      else if (this.mode === 'onlySiblings')
        tree = this.filterOnlySiblings(tree)
      return tree
    },
  },
  methods: {
    makeTree(): TocItem[] {
      return this.$slidev.nav.rawRoutes
        .filter((route: RouteRecordRaw) => route.meta?.slide?.title)
        .reduce((acc: TocItem[], route: RouteRecordRaw) => {
          this.addToTree(acc, route)
          return acc
        }, [])
    },
    addToTree(tree: TocItem[], route: RouteRecordRaw, level = 1) {
      const titleLevel = route.meta?.slide?.titleLevel
      if (titleLevel && titleLevel > level && tree.length > 0) {
        this.addToTree(tree[tree.length - 1].children, route, level + 1)
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
    },
    addActiveStatuses(tree: TocItem[], hasActiveParent = false, parent?: TocItem) {
      tree.forEach((item: TocItem) => {
        item.active = item.path === this.$slidev.nav.currentRoute?.path
        item.hasActiveParent = hasActiveParent
        if (item.children.length > 0)
          this.addActiveStatuses(item.children, item.active || item.hasActiveParent, item)
        if (parent && (item.active || item.activeParent))
          parent.activeParent = true
      })
    },
    filterTree(tree: TocItem[], level = 1): TocItem[] {
      if (level > Number(this.maxDepth)) {
        return []
      }
      else if (level < Number(this.minDepth)) {
        const activeItem = tree.find(item => item.active || item.activeParent)
        return activeItem ? this.filterTree(activeItem.children, level + 1) : []
      }
      return tree
        .filter((item: TocItem) => !item.skipInToc)
        .map((item: TocItem) => ({ ...item, children: this.filterTree(item.children, level + 1) }))
    },
    filterOnlyCurrentTree(tree: TocItem[]): TocItem[] {
      return tree
        .filter((item: TocItem) => item.active || item.activeParent || item.hasActiveParent)
        .map((item: TocItem) => ({ ...item, children: this.filterOnlyCurrentTree(item.children) }))
    },
    filterOnlySiblings(tree: TocItem[]): TocItem[] {
      const treehasActiveItem = tree.some(item => item.active || item.activeParent || item.hasActiveParent)
      return tree
        .filter(() => treehasActiveItem)
        .map((item: TocItem) => ({ ...item, children: this.filterOnlySiblings(item.children) }))
    },
  },
})
</script>

<template>
  <div :style="{ columnCount: columns }">
    <toc-list :level="1" :list="toc" />
  </div>
</template>
