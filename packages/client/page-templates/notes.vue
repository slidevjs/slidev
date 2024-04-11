<template>
  <div class="flex flex-col h-full">
    <slot name="progress-bar" />
    <div class="flex flex-col flex-grow">
      <slot name="content" class="p-5" />
      <div class="flex-none border-t border-main">
        <div class="flex gap-1 items-center px-6 py-3">
          <slot name="controls" />
          <div class="flex-auto" />
          <slot name="slide-no" class="pa-2 text-center" />
        </div>
      </div>
    </div>
  </div>
</template>
