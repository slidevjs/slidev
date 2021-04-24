<template>
  <header v-if="showHero" class="home-hero">
    <p align="center">
      <a href="https://github.com/slidevjs/slidev">
        <img src="/logo-title.png" alt="Slidev" height="300">
      </a>
      <br>
    </p>
    <div class="description !-mt-4">
      Presentation <b>Sli</b>des for <b>Dev</b>elopers
    </div>

    <NavLink
      v-if="hasAction"
      :item="{ link: data.actionLink, text: data.actionText }"
      class="action mx-2 rounded-tr-4xl rounded-tl-2xl rounded-br-2xl rounded-bl-3xl"
    />

    <NavLink
      v-if="hasAltAction"
      :item="{ link: data.altActionLink, text: data.altActionText }"
      class="action alt mx-2 rounded-tr-2xl rounded-tl-3xl rounded-br-4xl rounded-bl-4xl"
    />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSiteDataByRoute, useFrontmatter } from 'vitepress'
import { isDark } from '../composables/dark'
import NavLink from './NavLink.vue'

const site = useSiteDataByRoute()
const data = useFrontmatter()

const hasHeroText = computed(() => data.value.heroText !== null)
const heroText = computed(() => data.value.heroText || site.value.title)

const hasTagline = computed(() => data.value.tagline !== null)
const tagline = computed(() => data.value.tagline || site.value.description)

const hasAction = computed(() => data.value.actionLink && data.value.actionText)
const hasAltAction = computed(() => data.value.altActionLink && data.value.altActionText)

const showHero = computed(() => {
  return data.value.heroImage
    || hasHeroText.value
    || hasTagline.value
    || hasAction.value
})
</script>

<style scoped>
.home-hero {
  margin: 0rem 0 2.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

@media (min-width: 420px) {
  .home-hero {
    margin: 0rem 0;
  }
}

@media (min-width: 720px) {
  .home-hero {
    margin: 0rem 0 4.25rem;
  }
}

.figure {
  padding: 0 1.5rem;
}

.image {
  display: block;
  margin: 0 auto;
  width: auto;
  max-width: 100%;
  max-height: 280px;
}

.title {
  margin-top: 1.5rem;
  font-size: 2rem;
}

@media (min-width: 420px) {
  .title {
    font-size: 3rem;
  }
}

@media (min-width: 720px) {
  .title {
    margin-top: 2rem;
  }
}

.description {
  margin: 0;
  line-height: 1.3;
  font-size: 1.2rem;
  color: var(--c-text-light);
}

.action {
  margin-top: 1.5rem;
  display: inline-block;
}

@media (min-width: 420px) {
  .action {
    margin-top: 2rem;
    display: inline-block;
  }
}

.action {
  display: inline-block;
  padding: 10px 18px;
  line-height: 40px;
  border: 0;
  color: #ffffff;
  background-color: var(--c-brand);
  transition: background-color 0.1s ease;
}

.action :deep(.item) {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 0;
}

.action:hover :deep(.item) {
  text-decoration: none;
  color: #ffffff;
}

.action.alt {
  background-color: #476582;
}

.action.alt:hover {
  background-color: #304a64;
}
</style>
