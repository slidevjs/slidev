<template>
  <div class="nav-dropdown-link" :class="{ open }">
    <button class="button" :aria-label="item.ariaLabel" @click="toggle">
      <span class="button-text">{{ item.text }}</span>
      <span class="button-arrow" :class="open ? 'down' : 'right'" />
    </button>

    <ul class="dialog">
      <li v-for="item in item.items" :key="item.text" class="dialog-item">
        <NavDropdownLinkItem :item="item" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import type { DefaultTheme } from '../config'
import NavDropdownLinkItem from './NavDropdownLinkItem.vue'

defineProps<{
  item: DefaultTheme.NavItemWithChildren
}>()

const route = useRoute()

const open = ref(false)

watch(() => route.path, () => { open.value = false })

function toggle() {
  open.value = !open.value
}
</script>

<style scoped>
.nav-dropdown-link {
  position: relative;
  height: 36px;
  overflow: hidden;
  cursor: pointer;
}

@media (min-width: 720px) {
  .nav-dropdown-link {
    height: auto;
    overflow: visible;
  }

  .nav-dropdown-link:hover .dialog {
    display: block;
  }
}

.nav-dropdown-link.open {
  height: auto;
}

.button {
  display: block;
  border: 0;
  padding: 0 1.5rem;
  width: 100%;
  text-align: left;
  line-height: 36px;
  font-family: var(--font-family-base);
  font-size: 1rem;
  font-weight: 600;
  color: var(--c-text);
  white-space: nowrap;
  background-color: transparent;
  cursor: pointer;
}

.button:focus {
  outline: 0;
}

@media (min-width: 720px) {
  .button {
    border-bottom: 2px solid transparent;
    padding: 0;
    line-height: 24px;
    font-size: .9rem;
    font-weight: 500;
  }
}

.button-arrow {
  display: inline-block;
  margin-top: -1px;
  margin-left: 8px;
  border-top: 6px solid #ccc;
  border-right: 4px solid transparent;
  border-bottom: 0;
  border-left: 4px solid transparent;
  vertical-align: middle;
}

.button-arrow.right {
  transform: rotate(-90deg);
}

@media (min-width: 720px) {
  .button-arrow.right {
    transform: rotate(0);
  }
}

.dialog {
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 720px) {
  .dialog {
    display: none;
    position: absolute;
    top: 26px;
    right: -8px;
    border-radius: 6px;
    padding: 12px 0;
    min-width: 128px;
    background-color: var(--c-bg);
    box-shadow: var(--shadow-3);
  }
}
</style>
