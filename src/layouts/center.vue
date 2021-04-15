<template>
  <div class="master center">
    <div class="my-auto">
      <slot />
    </div>
  </div>
</template>

<style lang="postcss">
.master.center {
  @apply h-full grid place-content-center;
}
</style>
