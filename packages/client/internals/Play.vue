<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { isPrintMode, showEditor, windowSize, isScreenVertical, slideScale } from '../state'
import { next, prev, currentRoute, clicks, clicksElements, useSwipeControls, rawRoutes, nextRoute } from '../logic/nav'
import { registerShotcuts } from '../logic/shortcuts'
import Controls from './Controls.vue'
import SlideContainer from './SlideContainer.vue'
import Editor from './Editor.vue'
import NavControls from './NavControls.vue'
import SlideWrapper from './SlideWrapper.vue'

registerShotcuts()

// preload next route
watch(currentRoute, () => {
  if (currentRoute.value?.meta)
    currentRoute.value.meta.loaded = true
  if (nextRoute.value?.meta)
    nextRoute.value.meta.loaded = true
}, { immediate: true })

const root = ref<HTMLDivElement>()
function onClick(e: MouseEvent) {
  if (showEditor.value)
    return

  if ((e.target as HTMLElement)?.id === 'slide-container') {
    // click right to next, left to previouse
    if ((e.screenX / window.innerWidth) > 0.6)
      next()
    else
      prev()
  }
}

useSwipeControls(root)

const presistNav = computed(() => isScreenVertical.value || showEditor.value)

const getClass = (route: RouteRecordRaw) => {
  const no = route?.meta?.slide?.no
  if (no != null)
    return `slidev-page-${no}`
  return ''
}
</script>

<template>
  <div id="page-root" ref="root" class="grid grid-cols-[1fr,max-content]">
    <SlideContainer
      class="w-full h-full bg-black"
      :width="isPrintMode ? windowSize.width.value : undefined"
      :scale="slideScale"
      @click="onClick"
    >
      <template #>
        <template v-for="route of rawRoutes" :key="route.path">
          <SlideWrapper
            :is="route?.component"
            v-show="route === currentRoute"
            v-if="route.meta.loaded"
            :clicks="route === currentRoute ? clicks : 0"
            :clicks-elements="route.meta.clicksElements"
            :clicks-disabled="false"
            :class="getClass(route)"
          />
        </template>
      </template>
      <template #controls>
        <div
          class="absolute bottom-0 left-0 transition duration-300 opacity-0 hover:opacity-100"
          :class="presistNav ? 'opacity-100 right-0' : 'oapcity-0 p-2'"
        >
          <NavControls
            class="m-auto"
            :class="presistNav
              ? 'text-white bg-transparent'
              : 'rounded-md bg-main shadow dark:(border border-gray-400 border-opacity-10)'"
          />
        </div>
      </template>
    </SlideContainer>

    <template v-if="__DEV__">
      <Editor v-if="showEditor" />
    </template>
  </div>
  <Controls />
</template>
