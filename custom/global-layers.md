# Global Layers

> Available since v0.17

Global layers allow you to have custom components that **persistent** across slides. This could be useful for having footers, cross-slides animations, global effects, etc.

Slidev provides two layers for this usage, create `global-top.vue` or `global-bottom.vue` under your project root and it will pick up automatically.

Layers relationship:

- Global Top (`global-top.vue`)
- Slides
- Global Bottom (`global-bottom.vue`)

## Example

```html
<!-- global-top.vue -->
<template>
  <footer class="absolute bottom-0 left-0 right-0 p-2">Your Name</footer>
</template>
```

The text `Your Name` will appear to all your slides.

To enabled it conditionally, you can apply it with the [Vue Global Context](/custom/vue-context).

```html
<!-- hide the footer from Page 4 -->
<template>
  <footer
    v-if="$slidev.nav.currentPage !== 4"
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
    v-if="$slidev.nav.currentLayout !== 'cover'"
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
    v-if="$slidev.nav.currentLayout !== 'cover'"
    class="absolute bottom-0 left-0 right-0 p-2"
  >
    {{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}
  </footer>
</template>
```
