<template>
  <div class="master center">
    <div class="my-auto">
      <slot />
    </div>
  </div>
</template>

<style>
.master.center {
  @apply h-full grid place-content-center;
}
</style>
