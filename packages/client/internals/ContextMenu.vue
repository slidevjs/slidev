<script setup lang="ts">
import { onClickOutside, useElementBounding, useEventListener, useWindowFocus } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useDynamicSlideInfo } from '../composables/useSlideInfo'
import { configs } from '../env'
import { closeContextMenu, currentContextMenu } from '../logic/contextMenu'
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

const isExplicitEnabled = computed(() => configs.contextMenu != null)

const windowFocus = useWindowFocus()
watch(windowFocus, (hasFocus) => {
  if (!hasFocus)
    closeContextMenu()
})

const firstSlide = useDynamicSlideInfo(1)
function disableContextMenu() {
  const info = firstSlide.info.value
  if (!info)
    return
  firstSlide.update({
    frontmatter: {
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
    class="slidev-glass-effect fixed z-context-menu w-60 flex flex-wrap justify-items-start p-1 animate-fade-in animate-duration-100 rounded-md shadow overflow-hidden select-none"
    @contextmenu.prevent=""
    @click="closeContextMenu"
  >
    <template v-for="item, index of currentContextMenu.items.value" :key="index">
      <div v-if="item === 'separator'" :key="index" class="w-full my1 border-t border-main" />
      <div
        v-else-if="item.small"
        class="p-2 w-[40px] h-[40px] inline-block text-center cursor-pointer rounded flex"
        :class="item.disabled ? `op40` : `hover:bg-active`"
        :title="(item.label as string)"
        @click="item.action"
      >
        <div v-if="typeof item.icon === 'string'" :class="item.icon" class="text-1.2em ma" />
        <component :is="item.icon" v-else />
      </div>
      <div
        v-else
        class="w-full grid grid-cols-[35px_1fr] p-2 pl-0 cursor-pointer rounded"
        :class="item.disabled ? `op40` : `hover:bg-active`"
        @click="item.action"
      >
        <div class="mx-auto flex">
          <div v-if="typeof item.icon === 'string'" :class="item.icon" class="text-1.2em ma" />
          <component :is="item.icon" v-else />
        </div>
        <div v-if="typeof item.label === 'string'">
          {{ item.label }}
        </div>
        <component :is="item.label" v-else />
      </div>
    </template>
    <template v-if="!isExplicitEnabled">
      <div class="w-full my1 border-t border-main" />
      <div class="w-full text-xs p2">
        <div class="text-main text-opacity-50!">
          Hold <kbd class="border px1 py0.5 border-main rounded text-primary">Shift</kbd> and right click to open the native context menu
          <button
            v-if="__DEV__"
            class="underline op50 hover:op100 mt1 block"
            @click="disableContextMenu()"
          >
            Disable custom context menu
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
