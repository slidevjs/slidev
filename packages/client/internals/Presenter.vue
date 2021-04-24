<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { useNavigateControls } from '../logic'
import { showOverview } from '../state'
import SlideContainer from './SlideContainer.vue'
import NavControls from './NavControls.vue'
import SlidesOverview from './SlidesOverview.vue'

useHead({
  title: 'Presenter Mode',
})

const controls = useNavigateControls()
</script>

<template>
  <div class="grid-container">
    <div class="grid-section top flex">
      <div class="px-6 my-auto">
        {{ controls.currentPage.value + 1}} / {{ controls.routes.length }}
      </div>
      <div class="flex-auto" />
      <NavControls mode="persist" />
    </div>
    <div class="grid-section main flex flex-col p-4 bg-gray-400 bg-opacity-10">
      <SlideContainer class="h-full w-full ">
        <component :is="controls.currentRoute.value?.component" />
      </SlideContainer>
    </div>
    <div class="grid-section next flex flex-col p-4 bg-gray-400 bg-opacity-10">
      <SlideContainer class="h-full w-full">
        <component :is="controls.nextRoute.value?.component" />
      </SlideContainer>
    </div>
    <div class="grid-section note"></div>
    <div class="grid-section bottom"></div>
  </div>
  <SlidesOverview v-model="showOverview" />
</template>

<style lang="postcss" scoped>
.section-title {
  @apply px-4 py-2 font-xl;
}

.grid-container {
  @apply h-full w-full bg-gray-400 bg-opacity-15;
  display: grid;
  grid-template-columns: 1fr 1.1fr 0.9fr;
  grid-template-rows: 0.2fr 1.5fr 1.7fr 0.9fr;
  gap: 1px 1px;
  grid-template-areas:
    "top top top"
    "main main next"
    "main main note"
    "bottom bottom bottom";
}

.grid-section {
  @apply bg-main;

  &.top {
    grid-area: top;
  }
  &.main {
    grid-area: main;
  }
  &.next {
    grid-area: next;
  }
  &.note {
    grid-area: note;
  }
  &.bottom {
    grid-area: bottom;
  }
}
</style>
