---
aside: false
---

<script setup>
import AddonGallery from '../.vitepress/theme/components/AddonGallery.vue'
</script>

# Addon Gallery

Browse awesome addons available for Slidev here.

Read more about <LinkInline link="guide/theme-addon#use-addon" /> to use them, and <LinkInline link="guide/write-addon" /> to create your own addon.

## Official Addons

<ClientOnly>
  <AddonGallery collection="official"/>
</ClientOnly>

## Community Addons

Here are the curated addons made by the community.

<!-- Edit in ./docs/.vitepress/addons.ts -->
<ClientOnly>
  <AddonGallery collection="community"/>
</ClientOnly>

## More Addons

Find all the [addons available on NPM](https://www.npmjs.com/search?q=keywords%3Aslidev-addon).
