<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'
import { currentPage, downloadPDF, hasNext, hasPrev, isEmbedded, isPresenter, next, presenterPassword, prev, showPresenter, total } from '../logic/nav'
import { activeElement, breakpoints, fullscreen, showEditor, showInfoDialog, showPresenterCursor, toggleOverview } from '../state'
import { brush, drawingEnabled } from '../logic/drawings'
import { configs } from '../env'
import Settings from './Settings.vue'
import MenuButton from './MenuButton.vue'
import VerticalDivider from './VerticalDivider.vue'

// @ts-expect-error virtual module
import CustomNavControls from '/@slidev/custom-nav-controls'

const props = defineProps({
  persist: {
    default: false,
  },
})

const md = breakpoints.smaller('md')
const { isFullscreen, toggle: toggleFullscreen } = fullscreen

const query = computed(() => presenterPassword.value ? `?password=${presenterPassword.value}` : '')
const presenterLink = computed(() => `/presenter/${currentPage.value}${query.value}`)
const nonPresenterLink = computed(() => `/${currentPage.value}${query.value}`)

const root = ref<HTMLDivElement>()
function onMouseLeave() {
  if (root.value && activeElement.value && root.value.contains(activeElement.value))
    activeElement.value.blur()
}

const barStyle = computed(() => props.persist
  ? 'text-$slidev-controls-foreground bg-transparent'
  : 'rounded-md bg-main shadow dark:border dark:border-gray-400 dark:border-opacity-10',
)

const RecordingControls = shallowRef<any>()
if (__SLIDEV_FEATURE_RECORD__)
  import('./RecordingControls.vue').then(v => RecordingControls.value = v.default)

const DrawingControls = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__)
  import('./DrawingControls.vue').then(v => DrawingControls.value = v.default)
</script>

<template>
  <nav ref="root" class="flex flex-col">
    <div
      class="flex flex-wrap-reverse text-xl gap-0.5 p-1 lg:gap-1 lg:p-2"
      :class="barStyle"
      @mouseleave="onMouseLeave"
    >
      <button v-if="!isEmbedded" class="slidev-icon-btn" @click="toggleFullscreen">
        <carbon:minimize v-if="isFullscreen" />
        <carbon:maximize v-else />
      </button>

      <button class="slidev-icon-btn" :class="{ disabled: !hasPrev }" @click="prev">
        <carbon:arrow-left />
      </button>

      <button class="slidev-icon-btn" :class="{ disabled: !hasNext }" title="Next" @click="next">
        <carbon:arrow-right />
      </button>

      <button v-if="!isEmbedded" class="slidev-icon-btn" title="Slides overview" @click="toggleOverview()">
        <carbon:apps />
      </button>

      <button
        v-if="!isColorSchemaConfigured"
        class="slidev-icon-btn"
        title="Toggle dark mode"
        @click="toggleDark()"
      >
        <carbon-moon v-if="isDark" />
        <carbon-sun v-else />
      </button>

      <VerticalDivider />

      <template v-if="!isEmbedded">
        <template v-if="!isPresenter && !md && RecordingControls">
          <RecordingControls />
          <VerticalDivider />
        </template>

        <button
          v-if="isPresenter"
          class="slidev-icon-btn"
          title="Show presenter cursor"
          @click="showPresenterCursor = !showPresenterCursor"
        >
          <ph-cursor-fill v-if="showPresenterCursor" />
          <ph-cursor-duotone v-else class="opacity-50" />
        </button>
      </template>

      <template v-if="__SLIDEV_FEATURE_DRAWINGS__ && (!configs.drawings.presenterOnly || isPresenter) && !isEmbedded">
        <button class="slidev-icon-btn relative" title="Drawing" @click="drawingEnabled = !drawingEnabled">
          <carbon:pen />
          <div
            v-if="drawingEnabled"
            class="absolute left-1 right-1 bottom-0 h-0.7 rounded-full"
            :style="{ background: brush.color }"
          />
        </button>
        <VerticalDivider />
      </template>

      <template v-if="!isEmbedded">
        <RouterLink v-if="isPresenter" :to="nonPresenterLink" class="slidev-icon-btn" title="Play Mode">
          <carbon:presentation-file />
        </RouterLink>
        <RouterLink v-if="__SLIDEV_FEATURE_PRESENTER__ && showPresenter" :to="presenterLink" class="slidev-icon-btn" title="Presenter Mode">
          <carbon:user-speaker />
        </RouterLink>

        <button v-if="__DEV__ && !isPresenter" class="slidev-icon-btn <md:hidden" @click="showEditor = !showEditor">
          <carbon:text-annotation-toggle />
        </button>
      </template>
      <template v-if="!__DEV__">
        <button v-if="configs.download" class="slidev-icon-btn" @click="downloadPDF">
          <carbon:download />
        </button>
      </template>

      <button
        v-if="!isPresenter && configs.info && !isEmbedded"
        class="slidev-icon-btn"
        @click="showInfoDialog = !showInfoDialog"
      >
        <carbon:information />
      </button>

      <template v-if="!isPresenter && !isEmbedded">
        <MenuButton>
          <template #button>
            <button class="slidev-icon-btn">
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

      <CustomNavControls />
    </div>
  </nav>
</template>
