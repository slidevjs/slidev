<script setup lang="ts">
import { onClickOutside, useElementBounding, useEventListener, useWindowFocus } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { closeContextMenu, currentContextMenu } from '../logic/contextMenu'
import { useDynamicSlideInfo } from '../composables/useSlideInfo'
import { windowSize } from '../state'

const container = ref<HTMLElement>()
onClickOutside(container, closeContextMenu)
useEventListener(document, 'mousedown', (ev) => {
  if (ev.buttons & 2)
    closeContextMenu()
}, {
  passive: true,
  capture: true,
})

const windowFocus = useWindowFocus()
watch(windowFocus, (hasFocus) => {
  if (!hasFocus)
    closeContextMenu()
})

const firstSlide = useDynamicSlideInfo(1)
function onClickDisable() {
  const info = firstSlide.info.value
  if (!info)
    return
  firstSlide.update({
    frontmatter: {
      ...info.frontmatter,
      contextMenu: false,
    },
  })
}

const { width, height } = useElementBounding(container)
const left = computed(() => {
  const x = currentContextMenu.value?.x
  if (!x)
    return 0
  if (x + width.value > windowSize.width.value)
    return windowSize.width.value - width.value
  return x
})
const top = computed(() => {
  const y = currentContextMenu.value?.y
  if (!y)
    return 0
  if (y + height.value > windowSize.height.value)
    return windowSize.height.value - height.value
  return y
})
</script>

<template>
  <div
    v-if="currentContextMenu"
    ref="container"
    :style="`left:${left}px;top:${top}px`"
    class="fixed z-100 w-60 flex flex-wrap justify-items-start p-.5 animate-fade-in animate-duration-100 backdrop-blur bg-white/60 dark:bg-black/60 b b-gray-500/50 rounded-md shadow shadow-gray-500 overflow-hidden select-none"
    @contextmenu.prevent=""
    @click="closeContextMenu"
  >
    <template v-for="item, index of currentContextMenu.items.value" :key="index">
      <div v-if="item === 'separator'" class="w-full mx-2 my-.5 border-t border-gray-500/70" />
      <div
        v-else-if="item.small"
        class="p-2 w-[40px] h-[40px] inline-block text-center cursor-pointer rounded"
        :class="item.disabled ? `op40` : `hover:(bg-dark/20 dark:bg-white/20)`"
        :title="item.label as string"
        @click="item.action"
      >
        <component :is="item.icon" />
      </div>
      <div
        v-else
        class="w-full grid grid-cols-[35px_1fr] p-2 pl-0 cursor-pointer rounded"
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
    <div class="w-full p-2 text-xs op60">
      <kbd class="b b-op-50 rounded px-.5">shift</kbd> to open the default menu.
      <div class="underline mt-.5 -mb-.5" @click="onClickDisable">
        Disable context menu
      </div>
    </div>
  </div>
</template>
