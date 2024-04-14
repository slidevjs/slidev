<template>
  <div class="h-full w-full flex items-center justify-center gap-5 lt-md:flex-col">
    <RouterLink to="/" class="link">
      <carbon:presentation-file /> Slides
    </RouterLink>
    <RouterLink to="/presenter" class="link">
      <carbon:user-speaker /> Presenter
    </RouterLink>
    <RouterLink to="/notes" class="link">
      <carbon:catalog /> Notes
    </RouterLink>
    <RouterLink to="/overview" class="link">
      <carbon:list-boxes /> Overview
    </RouterLink>
  </div>
</template>

<style scoped lang="postcss">
.link {
  @apply flex flex-col gap-2 items-center justify-center h-40 min-w-40 rounded bg-gray:10 p4 hover:bg-gray/20;
}

.link > :first-child {
  @apply text-3em op50;
}
</style>
