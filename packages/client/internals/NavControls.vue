<script setup lang="ts">
import { onClickOutside, useFullscreen } from '@vueuse/core'
import { defineProps, ref } from 'vue'
import { isDark, toggleDark } from '../logic/dark'
import { recorder } from '../logic/recording'
import { hasNext, hasPrev, prev, next } from '../logic/nav'
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

const dev = import.meta.env.DEV
</script>

<template>
  <nav
    class="bg-transparent rounded-bl flex text-xl py-2 pr-2 pl-4 transition text-gray-400 gap-1 duration-300"
    :class="mode === 'fixed' ? 'absolute top-0 right-0 opacity-0 hover:(shadow bg-main opacity-100)' : ''"
  >
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
        class="bg-main rounded shadow top-10 right-0 z-20 absolute"
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
