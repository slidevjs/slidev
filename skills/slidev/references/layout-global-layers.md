---
name: global-layers
description: Create components that persist across slides like footers and backgrounds
---

# Global Layers

Create components that persist across slides.

## Layer Files

Create in project root:
- `global-top.vue` - Above all slides (single instance)
- `global-bottom.vue` - Below all slides (single instance)
- `slide-top.vue` - Above each slide (per-slide instance)
- `slide-bottom.vue` - Below each slide (per-slide instance)
- `custom-nav-controls.vue` - Custom navigation controls

## Z-Order (top to bottom)

1. NavControls / custom-nav-controls.vue
2. global-top.vue
3. slide-top.vue
4. Slide Content
5. slide-bottom.vue
6. global-bottom.vue

## Example: Footer

```html
<!-- global-bottom.vue -->
<template>
  <footer class="absolute bottom-0 left-0 right-0 p-2">Your Name</footer>
</template>
```

## Conditional Rendering

```html
<!-- Hide on cover layout -->
<template>
  <footer v-if="$nav.currentLayout !== 'cover'" class="absolute bottom-0 p-2">
    {{ $nav.currentPage }} / {{ $nav.total }}
  </footer>
</template>
```

## Export Note

Use `--per-slide` export option when global layers depend on navigation state.
