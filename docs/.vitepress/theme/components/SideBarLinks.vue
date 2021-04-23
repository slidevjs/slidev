<template>
  <ul v-if="items.length > 0" class="sidebar-links">
    <SideBarLink v-for="item of items" :key="item.text" :item="item" />
  </ul>
</template>

<script setup lang="ts">
import { useSideBar } from '../composables/sideBar'
import { SideBarLink } from './SideBarLink'

const items = useSideBar()
</script>
