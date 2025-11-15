<!--
Usage:
```md
---
layout: two-cols-footer
---
This spans both columns at the bottom (footer)

::top::
This shows at the top, aligned to the start (top) of the grid

::left::
# Left
This shows on the left

::right::
# Right
This shows on the right

<style>
.two-cols-footer {
  column-gap: 20px; /* Adjust the gap size as needed */
}
</style>
```
-->

<script setup lang="ts">
const props = defineProps({
  class: {
    type: String,
  },
  layoutClass: {
    type: String,
  },
})
</script>

<template>
  <div class="slidev-layout two-cols-footer w-full h-full" :class="layoutClass">
    <div class="col-top" :class="props.class">
      <slot name="top" />
    </div>
    <div class="col-left" :class="props.class">
      <slot name="left" />
    </div>
    <div class="col-right" :class="props.class">
      <slot name="right" />
    </div>
    <div class="col-footer">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.two-cols-footer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto 1fr auto;
}

.col-top {
  grid-area: 1 / 1 / 2 / 3;
}

.col-left {
  grid-area: 2 / 1 / 3 / 2;
}

.col-right {
  grid-area: 2 / 2 / 3 / 3;
}

.col-footer {
  grid-area: 3 / 1 / 4 / 3;
}
</style>
