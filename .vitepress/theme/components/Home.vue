<template>
  <div class="home" aria-labelledby="main-title">
    <HomeHero />
    <slot name="hero" />
    <HomeFeatures />
    <slot name="features" />
    <HomeFooter />
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import HomeHero from './HomeHero.vue'
import HomeFeatures from './HomeFeatures.vue'
import HomeFooter from './HomeFooter.vue'
</script>

<style scoped>
.home {
  @apply overflow-x-hidden;
  padding-top: var(--header-height);
}
</style>
