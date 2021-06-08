<template>
  <header class="nav-bar" :class="{'no-toggle-btn': !showSidebar}">
    <ToggleSideBarButton v-if="showSidebar" @toggle="$emit('toggle')" />

    <NavBarTitle />

    <div class="flex-grow" />

    <div class="nav">
      <NavLinks />
    </div>

    <div class="nav-icons mr-2">
      <div class="item">
        <a class="nav-btn" href="https://chat.sli.dev" target="_blank" aria-label="Discord">
          <ri-discord-fill />
        </a>
      </div>

      <div class="item">
        <a class="nav-btn" href="https://twitter.com/Slidevjs" target="_blank" aria-label="Twitter">
          <ri-twitter-fill />
        </a>
      </div>

      <div v-if="repo" class="item">
        <a class="nav-btn" href="https://github.com/slidevjs/slidev" target="_blank" aria-label="View GitHub Repo">
          <ri-github-fill />
        </a>
      </div>

      <div class="item">
        <dark-mode-switch class="m-0 p-0"/>
      </div>
    </div>

    <slot name="search" />
  </header>
</template>

<script setup lang="ts">
import { defineEmit, defineProps } from 'vue'
import { useRepo } from '../composables/repo'
import NavBarTitle from './NavBarTitle.vue'
import NavLinks from './NavLinks.vue'
import ToggleSideBarButton from './ToggleSideBarButton.vue'
import DarkModeSwitch from './DarkModeSwitch.vue'

const repo = useRepo()

defineEmit(['toggle'])

defineProps({
  showSidebar: { type: Boolean, required: true },
})
</script>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: var(--z-index-navbar);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--c-divider);
  padding: 0.7rem 1.5rem 0.7rem 4rem;
  height: var(--header-height);
  @apply bg-main;
}

.nav-bar.no-toggle-btn {
  padding-left: 1.5rem;
}

.nav-bar.root {
  border-color: transparent;
  background-color: var(--c-bg-semi);
}

@media (min-width: 720px) {
  .nav-bar {
    padding: 0.7rem 0.8rem 0.7rem 1.5rem;
  }
}

.flex-grow {
  flex-grow: 1;
}

.nav {
  display: none;
}

@media (min-width: 720px) {
  .nav {
    display: flex;
  }
  .navbar__dark-mode {
    display: none;
  }
}

.nav-icons {
  align-items: center;
  border-bottom: 0;
  margin-left: 12px;
  @apply flex gap-3 pl-2;
}
</style>
