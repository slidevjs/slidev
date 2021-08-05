<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { isDark, toggleDark, isColorSchemaConfigured } from '../logic/dark'
import { hasNext, hasPrev, prev, next, total, isPresenter, currentPage, downloadPDF, isEmbedded } from '../logic/nav'
import { toggleOverview, showEditor, showInfoDialog, fullscreen, breakpoints, activeElement } from '../state'
import { drauuEnabled, drauuMode, drauuBrush } from '../logic/drauu'
import { configs } from '../env'
import Settings from './Settings.vue'
import MenuButton from './MenuButton.vue'
import VerticalDivider from './VerticalDivider.vue'

defineProps({
  mode: {
    default: 'fixed',
  },
})

const md = breakpoints.smaller('md')
const { isFullscreen, toggle: toggleFullscreen } = fullscreen

const presenterLink = computed(() => `/presenter/${currentPage.value}`)
const nonPresenterLink = computed(() => `/${currentPage.value}`)

const root = ref<HTMLDivElement>()
const onMouseLeave = () => {
  if (root.value && activeElement.value && root.value.contains(activeElement.value))
    activeElement.value.blur()
}

const RecordingControls = shallowRef<any>()
const DrauuControls = shallowRef<any>()
if (__DEV__) {
  import('./RecordingControls.vue').then(v => RecordingControls.value = v.default)
  import('./DrauuControls.vue').then(v => DrauuControls.value = v.default)
}
</script>

<template>
  <nav ref="root" class="flex flex-wrap-reverse text-xl p-2 gap-1" @mouseleave="onMouseLeave">
    <button v-if="!isEmbedded" class="icon-btn" @click="toggleFullscreen">
      <carbon:minimize v-if="isFullscreen" />
      <carbon:maximize v-else />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasPrev }" @click="prev">
      <carbon:arrow-left />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasNext }" title="Next" @click="next">
      <carbon:arrow-right />
    </button>

    <button v-if="!isEmbedded" class="icon-btn" title="Slides overview" @click="toggleOverview()">
      <carbon:apps />
    </button>

    <button v-if="!isColorSchemaConfigured" class="icon-btn" title="Toggle dark mode" @click="toggleDark()">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>

    <VerticalDivider />

    <template v-if="__DEV__ && !isEmbedded">
      <template v-if="!isPresenter && !md && RecordingControls">
        <RecordingControls />
        <VerticalDivider />
      </template>

      <template v-if="!isPresenter && DrauuControls">
        <button class="icon-btn relative" @click="drauuEnabled = !drauuEnabled">
          <carbon:draw />
          <div
            v-if="drauuEnabled"
            class="absolute left-1 right-1 bottom-0 h-0.7 rounded-full"
            :style="{ background: drauuBrush.color }"
          ></div>
        </button>
        <DrauuControls v-if="drauuEnabled" class="absolute bottom-17 left-2" />
        <VerticalDivider />
      </template>

      <RouterLink v-if="isPresenter" :to="nonPresenterLink" class="icon-btn" title="Play Mode">
        <carbon:presentation-file />
      </RouterLink>
      <RouterLink v-if="!isPresenter" :to="presenterLink" class="icon-btn" title="Presenter Mode">
        <carbon:user-speaker />
      </RouterLink>

      <button v-if="!isPresenter" class="icon-btn <md:hidden" @click="showEditor = !showEditor">
        <carbon:text-annotation-toggle />
      </button>
    </template>
    <template v-else>
      <button v-if="configs.download" class="icon-btn" @click="downloadPDF">
        <carbon:download />
      </button>
    </template>

    <button v-if="!isPresenter && configs.info && !isEmbedded" class="icon-btn" @click="showInfoDialog = !showInfoDialog">
      <carbon:information />
    </button>

    <template v-if="!isPresenter && !isEmbedded">
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

    <VerticalDivider v-if="!isEmbedded" />

    <div class="h-40px flex" p="l-1 t-0.5 r-2" text="sm leading-2">
      <div class="my-auto">
        {{ currentPage }}
        <span class="opacity-50">/ {{ total }}</span>
      </div>
    </div>
  </nav>
</template>
