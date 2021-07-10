<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { isDark, toggleDark, isColorSchemaConfigured } from '../logic/dark'
import { hasNext, hasPrev, prev, next, total, isPresenter, currentPage, downloadPDF, isEmbedded } from '../logic/nav'
import { toggleOverview, showEditor, showInfoDialog, fullscreen, breakpoints, activeElement } from '../state'
import { configs } from '../env'
import Settings from './Settings.vue'
import MenuButton from './MenuButton.vue'

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
if (__DEV__)
  import('./RecordingControls.vue').then(v => RecordingControls.value = v.default)
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

    <button v-if="!isEmbedded" class="icon-btn" title="Slides overview" @click="toggleOverview">
      <carbon:apps />
    </button>

    <button v-if="!isColorSchemaConfigured" class="icon-btn" title="Toggle dark mode" @click="toggleDark">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>

    <div class="w-1px m-2 opacity-10 bg-current"></div>

    <template v-if="__DEV__ && !isEmbedded">
      <RouterLink v-if="isPresenter" :to="nonPresenterLink" class="icon-btn" title="Play Mode">
        <carbon:presentation-file />
      </RouterLink>

      <template v-if="!isPresenter && !md && RecordingControls">
        <RecordingControls />

        <div class="w-1px m-2 opacity-10 bg-current"></div>
      </template>

      <RouterLink v-if="!isPresenter" :to="presenterLink" class="icon-btn" title="Presenter Mode">
        <carbon:user-speaker />
      </RouterLink>

      <button v-if="!isPresenter" class="icon-btn <md:hidden" @click="showEditor = !showEditor">
        <carbon:edit />
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

    <div v-if="!isEmbedded" class="w-1px m-2 opacity-10 bg-current"></div>

    <div class="h-40px flex" p="l-1 t-0.5 r-2" text="sm leading-2">
      <div class="my-auto">
        {{ currentPage }}
        <span class="opacity-50">/ {{ total }}</span>
      </div>
    </div>
  </nav>
</template>
