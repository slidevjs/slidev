<template>
  <aside class="sidebar" :class="{ open }">
    <NavLinks class="nav" />

    <slot name="sidebar-top" />

    <SideBarLinks />

    <slot name="sidebar-bottom" />
  </aside>
</template>

<script setup lang="ts">
import NavLinks from './NavLinks.vue'
import SideBarLinks from './SideBarLinks.vue'

defineProps({
  open: { type: Boolean, required: true },
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: var(--header-height);
  bottom: 0;
  left: 0;
  z-index: var(--z-index-sidebar);
  border-right: 1px solid var(--c-divider);
  width: var(--sidebar-width);
  background-color: var(--c-bg);
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
}

@media (min-width: 720px) {
  .sidebar {
    transform: translateX(0);
  }
}

.sidebar.open {
  transform: translateX(0);
}

.nav {
  display: block;
}

@media (min-width: 720px) {
  .nav {
    display: none;
  }
}
</style>
