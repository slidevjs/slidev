<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'
import { computed, defineProps } from 'vue'
import { isString } from '@antfu/utils'
import { isDark, toggleDark } from '../logic/dark'
import { hasNext, hasPrev, prev, next, isPresenter, currentPage } from '../logic/nav'
import { showOverview, showEditor, showInfoDialog } from '../state'
import { configs } from '../env'
import RecordingControls from './RecordingControls.vue'

defineProps({
  mode: {
    default: 'fixed',
  },
})

const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(document.body)

const presenterLink = computed(() => `${location.origin}/presenter/${currentPage.value}`)
const nonPresenterLink = computed(() => `${location.origin}/${currentPage.value}`)

async function downloadPDF() {
  const { saveAs } = await import('file-saver')
  saveAs(
    isString(configs.download)
      ? configs.download
      : `${import.meta.env.BASE_URL}slidev-exported.pdf`,
    `${configs.title}.pdf`,
  )
}
</script>

<template>
  <nav class="flex text-xl p-2 text-gray-600 dark:text-gray-300 gap-1">
    <button class="icon-btn" @click="toggleFullscreen">
      <carbon:minimize v-if="isFullscreen" />
      <carbon:maximize v-else />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasPrev }" @click="prev">
      <carbon:arrow-left />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasNext }" title="Next" @click="next">
      <carbon:arrow-right />
    </button>

    <button class="icon-btn" title="Slides overview" @click="showOverview = !showOverview">
      <carbon:apps />
    </button>

    <button class="icon-btn" title="Toggle dark mode" @click="toggleDark">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>

    <div class="w-1px m-2 opacity-10 bg-current"></div>

    <template v-if="__DEV__">
      <a v-if="isPresenter" :href="nonPresenterLink" class="icon-btn" title="Play Mode">
        <carbon:presentation-file />
      </a>

      <RecordingControls v-if="!isPresenter" />

      <div class="w-1px m-2 opacity-10 bg-current"></div>

      <a v-if="!isPresenter" :href="presenterLink" class="icon-btn" title="Presenter Mode">
        <carbon:user-speaker />
      </a>

      <button v-if="!isPresenter" class="icon-btn" @click="showEditor = !showEditor">
        <carbon:edit />
      </button>
    </template>
    <template v-else>
      <button v-if="configs.download" class="icon-btn" @click="downloadPDF">
        <carbon:download />
      </button>
      <button v-if="configs.info" class="icon-btn" @click="showInfoDialog = !showInfoDialog">
        <carbon:information />
      </button>
    </template>
  </nav>
</template>
