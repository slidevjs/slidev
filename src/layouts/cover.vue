<template>
  <div class="master cover">
    <div class="my-auto">
      <RouterView />
    </div>
  </div>
</template>

<style>
.master.cover {
  @apply h-full flex;

  h1 {
    @apply text-9xl leading-50;
  }

  h1 ~ p {
    @apply opacity-40 mb-20 text-5xl;
  }
}
</style>
