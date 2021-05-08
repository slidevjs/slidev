<script setup lang="ts">
import { computed, defineProps, ref } from 'vue'
import { isDark, toggleDark } from '../logic/dark'
import { hasNext, hasPrev, prev, next, total, isPresenter, currentPage, downloadPDF } from '../logic/nav'
import { toggleOverview, showEditor, showInfoDialog, fullscreen, breakpoints, activeElement } from '../state'
import { configs } from '../env'
import RecordingControls from './RecordingControls.vue'
import Settings from './Settings.vue'
import MenuButton from './MenuButton.vue'

defineProps({
  mode: {
    default: 'fixed',
  },
})

const md = breakpoints.smaller('md')
const { isFullscreen, toggle: toggleFullscreen } = fullscreen

const presenterLink = computed(() => `${location.origin}/presenter/${currentPage.value}`)
const nonPresenterLink = computed(() => `${location.origin}/${currentPage.value}`)

const root = ref<HTMLDivElement>()
const onMouseLeave = () => {
  if (root.value && activeElement.value && root.value.contains(activeElement.value))
    activeElement.value.blur()
}
</script>

<template>
  <nav ref="root" class="flex flex-wrap-reverse text-xl p-2 gap-1" @mouseleave="onMouseLeave">
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

    <button class="icon-btn" title="Slides overview" @click="toggleOverview">
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

      <template v-if="!isPresenter && !md">
        <RecordingControls />

        <div class="w-1px m-2 opacity-10 bg-current"></div>
      </template>

      <a v-if="!isPresenter" :href="presenterLink" class="icon-btn" title="Presenter Mode">
        <carbon:user-speaker />
      </a>

      <button v-if="!isPresenter" class="icon-btn <md:hidden" @click="showEditor = !showEditor">
        <carbon:edit />
      </button>
    </template>
    <template v-else>
      <button v-if="configs.download" class="icon-btn" @click="downloadPDF">
        <carbon:download />
      </button>
    </template>

    <button v-if="configs.info" class="icon-btn" @click="showInfoDialog = !showInfoDialog">
      <carbon:information />
    </button>

    <template v-if="!isPresenter">
      <MenuButton>
        <template #button>
          <button class="icon-btn">
            <carbon:settings-adjust />
          </button>
        </template>
        <template #menu>
          <Settings />
        </template>
      </MenuButton>
    </template>

    <div class="w-1px m-2 opacity-10 bg-current"></div>

    <div class="h-40px flex" p="l-1 t-0.5 r-2" text="sm leading-2">
      <div class="my-auto">
        {{ currentPage }}
        <span class="opacity-50">/ {{ total }}</span>
      </div>
    </div>
  </nav>
</template>
