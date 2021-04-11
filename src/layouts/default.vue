<template>
  <main class="master default">
    <RouterView />
  </main>
</template>

<style>
.master {
  @apply px-30 py-12 text-4xl;

  h1 {
    @apply text-8xl leading-40;
  }
}

.master.default {
  h1 ~ p {
    @apply mb-10 -mt-4;
  }
}
</style>
