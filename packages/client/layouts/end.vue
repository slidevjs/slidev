<template>
  <div class="slidev-layout end">
    <slot>END</slot>
  </div>
</template>

<style scoped lang="postcss">
.slidev-layout.end {
  @apply text-white text-opacity-85 text-xl tracking-widest bg-black h-full text-center grid place-content-center select-none;
}
</style>
