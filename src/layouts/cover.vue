<template>
  <div class="master cover">
    <div class="my-auto">
      <KeepAlive>
        <slot />
      </KeepAlive>
    </div>
  </div>
</template>

<style>
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
