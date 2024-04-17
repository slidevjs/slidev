<template>
  <div class="h-full w-full flex items-center justify-center gap-5 lt-md:flex-col">
    <RouterLink to="/">
      <carbon:presentation-file /> Slides
    </RouterLink>
    <RouterLink to="/presenter">
      <carbon:user-speaker /> Presenter
    </RouterLink>
    <RouterLink to="/notes">
      <carbon:catalog /> Notes
    </RouterLink>
    <RouterLink to="/overview">
      <carbon:list-boxes /> Overview
    </RouterLink>
  </div>
</template>

<style scoped lang="postcss">
.page-link {
  @apply flex flex-col gap-2 items-center justify-center h-40 min-w-40 rounded bg-gray:10 p4 hover:bg-gray/20;
}

.page-link :first-child {
  @apply text-3em op50;
}
</style>
