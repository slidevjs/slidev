<template>
  <div class="master center">
    <div class="my-auto">
      <slot />
    </div>
  </div>
</template>

<style labg="postcss">
.master.center {
  @apply h-full grid place-content-center;
}
</style>
