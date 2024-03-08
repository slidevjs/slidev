---
layout: default
---

# Simple Vue SFC Runner

<!-- eslint-skip -->

```vue {monaco-run}
<script setup>
import { computed, ref } from 'vue'
const counter = ref(1)
const doubled = computed(() => counter.value * 2)
function inc() { counter.value++ }
</script>

<template>
  <div class="select-none text-lg flex gap-4 items-center">
    <span class="text-gray text-lg">
      <span class="text-orange">{{ counter }}</span>
      * 2 =
      <span class="text-green">{{ doubled }}</span>
    </span>
    <button class="border border-main p2 rounded" @click="inc">+1</button>
    <button class="border border-main p2 rounded" @click="counter -= 1">-1</button>
  </div>
</template>
```

---

This is a demo to prove the extensibility of Slidev Code Runners.

Refer to `./setup/monaco-runner.ts` for the implementation.

Note that there is a lot of edge cases that this demo is not handling. Extra work is needed to make it production ready.
