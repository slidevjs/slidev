<script setup lang="ts">
import { onClickOutside, useWindowFocus } from '@vueuse/core'
import { ref, watch } from 'vue'
import { closeContextMenu, contextMenuPos } from '../logic/contextMenu'
import setupContextMenu from '../setup/context-menu'

const container = ref<HTMLElement>()
onClickOutside(container, closeContextMenu)

const windowFocus = useWindowFocus()
watch(windowFocus, (hasFocus) => {
  if (!hasFocus)
    closeContextMenu()
})

const items = setupContextMenu()
</script>

<template>
  <div
    v-if="contextMenuPos"
    ref="container"
    :key="contextMenuPos"
    :style="contextMenuPos"
    class="fixed z-100 w-60 flex flex-wrap justify-items-start animate-fade-in animate-duration-100 backdrop-blur bg-white/60 dark:bg-black/60 b b-gray-500/50 rounded-md shadow shadow-gray-500 overflow-hidden"
    @contextmenu.prevent=""
    @click="closeContextMenu"
  >
    <template v-for="item, index of items" :key="index">
      <div v-if="item === 'separator'" class="w-full mx-2 my-1 border-t border-gray-500/70" />
      <div
        v-else-if="item.small"
        class="p-2 w-[40px] h-[40px] inline-block text-center"
        :class="item.disabled ? `op40` : `hover:(bg-dark/20 dark:bg-white/20)`"
        :title="item.label as string"
      >
        <component :is="item.icon" />
      </div>
      <div
        v-else
        class="w-full grid grid-cols-[35px_1fr] p-2 pl-0 cursor-pointer"
        :class="item.disabled ? `op40` : `hover:(bg-dark/20 dark:bg-white/20)`"
        @click="item.action"
      >
        <div class="mx-auto">
          <component :is="item.icon" />
        </div>
        <div v-if="typeof item.label === 'string'">
          {{ item.label }}
        </div>
        <component :is="item.label" v-else />
      </div>
    </template>
  </div>
</template>

<style scoped></style>
