<template>
  <div class="master cover">
    <div class="my-auto">
      <slot />
    </div>
  </div>
</template>

<style lang="postcss">
.master.cover {
  @apply h-full flex;

  h1 {
    @apply text-6xl leading-20;
  }

  h1 ~ p {
    @apply opacity-40 mb-10 text-2xl;
  }
}
</style>
