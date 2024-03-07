<template>
  <div class="slide">
    <div class="aspect-16/9" />
    <div class="absolute top-0 left-0 right-0 bottom-0">
      <slot />
    </div>
  </div>
</template>

<style lang="postcss">
.slide {
  background: var(--c-bg);
  font-size: 1em;
  line-height: 1.2em;
  border-radius: 7px;
  position: relative;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 0 30px 1px rgba(0, 0, 0, 0.15);
  @apply mt-4 transform translate-x-20 -translate-y-20 overflow-hidden;
}

.dark .slide {
  @apply bg-gray-400 bg-opacity-5 border border-gray-400 border-opacity-10;
}
</style>
