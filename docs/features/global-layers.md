---
tags: [navigation, layout]
description: |
  Create custom components that persist across slides.
---

# Global Layers

Global layers allow you to have custom components that **persist** across slides. This could be useful for having footers, cross-slide animations, global effects, etc.

Slidev provides three layers for this usage, create `global-top.vue`, `global-bottom.vue`, or `custom-nav-controls.vue` under your project root and it will pick up automatically.

There are also layers for **each** slide: `slide-top.vue` and `slide-bottom.vue`. The usage is similar to the global layers, but they are applied to every slide, so there may be more than one instance of them.

::: tip
If you are using `global-top.vue` or `global-bottom.vue` depending on the current navigation state, when exporting, the `--per-slide` option should be used to ensure the correct state is applied to each slide. Or you can use `slide-top.vue` and `slide-bottom.vue` instead.
:::

## Layers relationship

At z-axis, from top to bottom:

- NavControls
  - Customized Navigation Controls (`custom-nav-controls.vue`)
- Global Top (`global-top.vue`) - single instance
- Slide Top (`slide-top.vue`) - instance per slide
- Slide Content
- Slide Bottom (`slide-bottom.vue`) - instance per slide
- Global Bottom (`global-bottom.vue`) - single instance

## Example

```html
<!-- global-bottom.vue -->
<template>
  <footer class="absolute bottom-0 left-0 right-0 p-2">Your Name</footer>
</template>
```

The text `Your Name` will appear on all your slides.

```html
<!-- custom-nav-controls -->
<template>
  <button class="icon-btn" title="Next" @click="$nav.next">
    <div class="i-carbon:arrow-right" />
  </button>
</template>
```

The button `Next` will appear in NavControls.

To enable it conditionally, you can use the <LinkInline link="guide/global-context" />

```html
<!-- hide the footer from Page 4 -->
<template>
  <footer
    v-if="$nav.currentPage !== 4"
    class="absolute bottom-0 left-0 right-0 p-2"
  >
    Your Name
  </footer>
</template>
```

```html
<!-- hide the footer from "cover" layout -->
<template>
  <footer
    v-if="$nav.currentLayout !== 'cover'"
    class="absolute bottom-0 left-0 right-0 p-2"
  >
    Your Name
  </footer>
</template>
```

```html
<!-- an example footer for pages -->
<template>
  <footer
    v-if="$nav.currentLayout !== 'cover'"
    class="absolute bottom-0 left-0 right-0 p-2"
  >
    {{ $nav.currentPage }} / {{ $nav.total }}
  </footer>
</template>
```

```html
<!-- custom-nav-controls -->
<!-- hide the button in Presenter model -->
<template>
  <button v-if="!$nav.isPresenter" class="icon-btn" title="Next" @click="$nav.next">
    <div class="i-carbon:arrow-right" />
  </button>
</template>
```
