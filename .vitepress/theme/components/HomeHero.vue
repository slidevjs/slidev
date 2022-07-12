<template>
  <header v-if="showHero" class="home-hero flex">
    <div class="mx-auto grid lg:grid-cols-[minmax(400px,600px),minmax(500px,800px)] gap-4">
      <div class="my-auto pb-40 <md:pb-26">
        <p align="center">
          <a href="https://github.com/slidevjs/slidev">
            <img src="/logo-title.png" alt="Slidev" height="300" />
          </a>
          <br />
        </p>
        <div class="description !-mt-4">
          Presentation
          <b>Sli</b>des for
          <b>Dev</b>elopers
          <sup class="opacity-50">Beta</sup>
        </div>

        <NavLink
          v-if="hasAction"
          :item="{ link: frontmatter.actionLink, text: frontmatter.actionText }"
          class="action mx-2"
          rounded="tr-4xl tl-2xl br-2xl bl-3xl"
        />

        <NavLink
          v-if="hasAltAction"
          :item="{ link: frontmatter.altActionLink, text: frontmatter.altActionText }"
          class="action alt mx-2"
          rounded="tr-2xl tl-3xl br-4xl bl-4xl"
        />

        <div class="mt-5 flex">
          <div class="mx-auto">
            <p>or try it now</p>
            <div class="language-bash mt-2">
              <pre><code><span class="opacity-50">$ </span><span class="token function">npm init</span> <span class="token text-[#408c9e] font-500">slidev</span></code></pre>
            </div>
          </div>
        </div>

        <a href="https://github.com/slidevjs/slidev" class="mt-3 block filter dark:invert" target="__blank">
          <img alt="GitHub stars" src="https://img.shields.io/github/stars/slidevjs/slidev?style=social" />
        </a>
      </div>
      <ClientOnly>
        <Demo class="-mt-10 -mb-25" />
      </ClientOnly>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import NavLink from './NavLink.vue'

const {frontmatter} = useData()

const hasHeroText = computed(() => frontmatter.value.heroText !== null)
const hasTagline = computed(() => frontmatter.value.tagline !== null)

const hasAction = computed(() => frontmatter.value.actionLink && frontmatter.value.actionText)
const hasAltAction = computed(() => frontmatter.value.altActionLink && frontmatter.value.altActionText)

const showHero = computed(() => {
  return frontmatter.value.heroImage
    || hasHeroText.value
    || hasTagline.value
    || hasAction.value
})
</script>

<style scoped lang="postcss">
.home-hero {
  margin: 0rem 0 2.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

@media (min-width: 420px) {
  .home-hero {
    margin: 0;
  }
}

@media (min-width: 720px) {
  .home-hero {
    margin: 0 3rem;
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
  transition: background-color 0.1s ease;
  @apply bg-primary cursor-pointer;
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

.action:hover {
  @apply bg-primary-deep;
}

.action.alt {
  background-color: #476582;
}

.action.alt:hover {
  background-color: #304a64;
}
</style>
