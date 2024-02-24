<template>
  <div class="h-full w-full flex items-center justify-center gap-5 lt-md:flex-col">
    <RouterLink
      to="/"
      class="flex flex-col gap-2 items-center justify-center h-40 min-w-40 rounded bg-gray:10 p4 hover:bg-gray/20"
    >
      <carbon:presentation-file class="text-3em op50" />
      Slides
    </RouterLink>
    <RouterLink
      to="/presenter"
      class="flex flex-col gap-2 items-center justify-center h-40 min-w-40 rounded bg-gray:10 p4 hover:bg-gray/20"
    >
      <carbon:user-speaker class="text-3em op50" />
      Presenter
    </RouterLink>
    <RouterLink
      to="/notes"
      class="flex flex-col gap-2 items-center justify-center h-40 min-w-40 rounded bg-gray:10 p4 hover:bg-gray/20"
    >
      <carbon:catalog class="text-3em op50" />
      Notes
    </RouterLink>
    <RouterLink
      to="/overview"
      class="flex flex-col gap-2 items-center justify-center h-40 min-w-40 rounded bg-gray:10 p4 hover:bg-gray/20"
    >
      <carbon:list-boxes class="text-3em op50" />
      Overview
    </RouterLink>
  </div>
</template>
