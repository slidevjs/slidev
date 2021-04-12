---
layout: cover
---

# Composable Vue

Pattens and tips to write good composable functions for Vue.

<div class="mt-5">
Anthony Fu
</div>

---
---

# Markdown

## List

- All slides in one file
- HMR supported
- Light / Dark mode toggle
- Code snippets
  - Prism syntax highlighting
  - Built-in Moncoa Editor

---
---


# Table

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

---
---

# Code Snippet Example

It, just works

```html
<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'
</script>

<template>
  <nav class="opacity-25 py-2 px-4 transition">
    <button class="mx-2 icon-btn" @click="toggleDark">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>
  </nav>
</template>
```

---
---

# Monaco Example

Live coding in your presentation! 😎

<Monaco />

---
---

# Twitter Example

<Tweet url="https://twitter.com/antfu7/status/1362676666221268995" />

---
layout: end
---
