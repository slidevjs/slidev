<script setup lang="ts">
import { onClickOutside, useFullscreen } from '@vueuse/core'
import { computed, defineProps, ref } from 'vue'
import { isDark, toggleDark } from '../logic/dark'
import { recorder } from '../logic/recording'
import { hasNext, hasPrev, prev, next, isPresenter, currentPage } from '../logic/nav'
import { showOverview, showEditor, currentCamera } from '../state'
import DevicesList from './DevicesList.vue'

defineProps({
  mode: {
    default: 'fixed',
  },
})

const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(document.body)

const {
  recording,
  showAvatar,
  streamCamera,
  toggleRecording,
  toggleAvatar,
} = recorder

const devicesList = ref()
const showDevicesList = ref(false)

onClickOutside(devicesList, () => {
  showDevicesList.value = false
})

const presenterLink = computed(() => `${location.origin}/presenter/${currentPage.value}`)
const nonPresenterLink = computed(() => `${location.origin}/${currentPage.value}`)

const dev = import.meta.env.DEV
</script>

<template>
  <nav
    class="bg-transparent flex text-xl py-2 pr-4 pl-2 transition text-gray-400 gap-1 duration-300"
    :class="mode === 'fixed' ? 'absolute bottom-0 left-0 rounded-tr opacity-0 hover:(shadow bg-main opacity-100)' : ''"
  >
    <button class="icon-btn" @click="toggleFullscreen">
      <carbon:minimize v-if="isFullscreen" />
      <carbon:maximize v-else />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasPrev }" @click="prev">
      <carbon:arrow-left />
    </button>

    <button
      class="icon-btn"
      :class="{ disabled: !hasNext }"
      title="Next"
      @click="next"
    >
      <carbon:arrow-right />
    </button>

    <button
      class="icon-btn"
      title="Slides overview"
      @click="showOverview = !showOverview"
    >
      <carbon:apps />
    </button>

    <button
      class="icon-btn"
      title="Toggle dark mode"
      @click="toggleDark"
    >
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>

    <button
      v-if="dev"
      class="icon-btn"
      @click="showEditor = !showEditor"
    >
      <carbon:edit />
    </button>

    <a
      v-if="dev && !isPresenter"
      :href="presenterLink"
      class="icon-btn"
      title="Presenter Mode"
    >
      <carbon:user-speaker />
    </a>

    <a
      v-if="isPresenter"
      :href="nonPresenterLink"
      class="icon-btn"
      title="Play Mode"
    >
      <carbon:presentation-file />
    </a>

    <button
      v-if="currentCamera !== 'none'"
      class="icon-btn"
      :class="{'text-green-500': Boolean(showAvatar && streamCamera)}"
      title="Show camera view"
      @click="toggleAvatar"
    >
      <carbon:user-avatar />
    </button>

    <div
      ref="devicesList"
      class="flex relative"
    >
      <button
        class="icon-btn"
        :class="{'text-red-500': recording}"
        title="Recording"
        @click="toggleRecording"
      >
        <carbon:stop-outline v-if="recording" />
        <carbon:video v-else />
      </button>
      <button
        class="icon-btn !text-sm !px-0"
        :class="{disabled:recording}"
        @click="showDevicesList = !showDevicesList"
      >
        <carbon:chevron-down class="opacity-50" />
      </button>
      <DevicesList
        v-if="showDevicesList && !recording"
        class="bg-main rounded shadow top-10 right-0 z-20 absolute"
      />
    </div>
  </nav>
</template>
