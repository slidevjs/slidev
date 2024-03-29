<script setup lang="ts">
import { onClickOutside, useWindowFocus } from '@vueuse/core'
import { ref, watch } from 'vue'
import { closeContextMenu, currentContextMenu } from '../logic/contextMenu'

const container = ref<HTMLElement>()
onClickOutside(container, closeContextMenu)

const windowFocus = useWindowFocus()
watch(windowFocus, (hasFocus) => {
  if (!hasFocus)
    closeContextMenu()
})
</script>

<template>
  <div
    v-if="currentContextMenu"
    ref="container"
    :key="`${currentContextMenu[0]},${currentContextMenu[1]}`"
    :style="`left:${currentContextMenu[0]}px;top:${currentContextMenu[1]}px`"
    class="fixed z-100 w-60 flex flex-wrap justify-items-start animate-fade-in animate-duration-100 backdrop-blur bg-white/60 dark:bg-black/60 b b-gray-500/50 rounded-md shadow shadow-gray-500 overflow-hidden"
    @contextmenu.prevent=""
    @click="closeContextMenu"
  >
    <template v-for="item, index of currentContextMenu[2].value" :key="index">
      <div v-if="item === 'separator'" class="w-full mx-2 my-1 border-t border-gray-500/70" />
      <div
        v-else-if="item.small"
        class="p-2 w-[40px] h-[40px] inline-block text-center"
        :class="item.disabled ? `op40` : `hover:(bg-dark/20 dark:bg-white/20)`"
        :title="item.label as string"
        @click="item.action"
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
