<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { useData ,withBase} from 'vitepress';

const {site} = useData()
const themeConfig = computed(()=>site.value.themeConfig)
</script>

<template>
  <a
    class="nav-bar-title"
    :href="site.base"
    :aria-label="`${site.title}, back to home`"
  >
    <img
      v-if="themeConfig.logo"
      class="logo"
      :src="withBase(themeConfig.logo)"
      alt="Logo"
    >
    <span class="title text-primary-deep">
      <span class="font-600">Sli</span><span class="font-normal">dev</span>
    </span>
  </a>
</template>

<style scoped>
.nav-bar-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--c-text);
  vertical-align: center;
  white-space: nowrap;
  margin-right: 2rem;
}

.nav-bar-title:hover {
  text-decoration: none;
}

.logo {
  margin-right: .5rem;
  height: 2.2rem;
  vertical-align: middle;
}

.title {
  line-height: 2rem;
  vertical-align: middle;
}
</style>
