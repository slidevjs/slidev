<template>
  <div class="master center">
    <div class="my-auto">
      <KeepAlive>
        <slot />
      </KeepAlive>
    </div>
  </div>
</template>

<style>
.master.center {
  @apply h-full grid place-content-center;
}
</style>
