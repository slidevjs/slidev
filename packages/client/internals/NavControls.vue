<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'
import { computed, defineProps } from 'vue'
import { isDark, toggleDark } from '../logic/dark'
import { hasNext, hasPrev, prev, next, isPresenter, currentPage } from '../logic/nav'
import { showOverview, showEditor } from '../state'
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

function downloadPDF() {
  import('file-saver')
    .then(i => i.saveAs(`${import.meta.env.BASE_URL}slidev-exported.pdf`, `${configs.title}.pdf`))
}
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

    <template v-if="__DEV__">
      <button v-if="!isPresenter" class="icon-btn" @click="showEditor = !showEditor">
        <carbon:edit />
      </button>

      <a v-if="!isPresenter" :href="presenterLink" class="icon-btn" title="Presenter Mode">
        <carbon:user-speaker />
      </a>

      <a v-if="isPresenter" :href="nonPresenterLink" class="icon-btn" title="Play Mode">
        <carbon:presentation-file />
      </a>

      <RecordingControls v-if="!isPresenter" />
    </template>
    <template v-else>
      <button v-if="configs.allowDownload" class="icon-btn" @click="downloadPDF">
        <carbon:download />
      </button>
    </template>
  </nav>
</template>
