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

# Code Snippet Example

It, just works

<Transform scale='0.8'>

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

</Transform>

---
---

# Twitter Example

<Tweet url="https://twitter.com/antfu7/status/1362676666221268995" />
