---
aside: false
---

<script setup>
import ThemeGallery from '../.vitepress/theme/components/ThemeGallery.vue'
</script>

# Theme Gallery

Browse awesome themes available for Slidev here.

Read more about <LinkInline link="guide/theme-addon#use-theme" /> to use them, and <LinkInline link="guide/write-theme" /> to create your own theme.

## Official Themes {#official-themes}

<ClientOnly>
  <ThemeGallery collection="official"/>
</ClientOnly>

## Community Themes {#community-themes}

Here are the curated themes made by the community.

<!-- Edit in ./docs/.vitepress/themes.ts -->
<ClientOnly>
  <ThemeGallery collection="community"/>
</ClientOnly>

## More Themes {#more-themes}

Find all the [themes available on NPM](https://www.npmjs.com/search?q=keywords%3Aslidev-theme).
