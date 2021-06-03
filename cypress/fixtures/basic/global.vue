<template>
  <div
    v-if="$slidev.nav.currentPage % 2 === 1"
    class="absolute bottom-0 right-0 p-10"
  >
    Global Footer (appear only on odd page)
  </div>
</template>
