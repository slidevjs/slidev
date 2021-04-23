<script setup lang="ts">
import { onClickOutside, useFullscreen } from '@vueuse/core'
import { ref } from 'vue'
import { isDark, toggleDark, useNavigateControls } from '../logic'
import { recorder, currentCamera } from '../logic/recording'
import { showOverview, showEditor } from '../logic/state'
import DevicesList from './DevicesList.vue'

const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(document.body)
const { hasNext, hasPrev, prev, next, currentRoute } = useNavigateControls()

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

const dev = import.meta.env.DEV
</script>

<template>
  <nav class="opacity-0 py-2 pl-4 pr-2 transition right-0 top-0 rounded-bl text-xl flex gap-1 text-gray-400 bg-transparent duration-300 fixed hover:(shadow bg-main opacity-100)">
    <button
      v-if="dev"
      class="icon-btn"
      @click="showEditor = !showEditor"
    >
      <carbon:edit />
    </button>

    <button
      v-if="currentCamera !== 'none'"
      class="icon-btn"
      :class="{'text-green-500': Boolean(showAvatar && streamCamera)}"
      @click="toggleAvatar"
    >
      <carbon:user-avatar />
    </button>

    <div
      ref="devicesList"
      class="flex relative"
    >
      <button class="icon-btn" :class="{'text-red-500': recording}" @click="toggleRecording">
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
        class="absolute right-0 top-10 bg-main rounded shadow z-20"
      />
    </div>

    <button class="icon-btn" @click="showOverview = !showOverview">
      <carbon:apps />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasPrev }" @click="prev">
      <carbon:arrow-left />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasNext }" @click="next">
      <carbon:arrow-right />
    </button>

    <button class="icon-btn" @click="toggleFullscreen">
      <carbon:minimize v-if="isFullscreen" />
      <carbon:maximize v-else />
    </button>

    <button class="icon-btn" @click="toggleDark">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>
  </nav>
</template>
