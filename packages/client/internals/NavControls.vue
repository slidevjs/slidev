<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'
import { downloadPDF } from '../utils'
import { activeElement, breakpoints, fullscreen, presenterLayout, showEditor, showInfoDialog, showPresenterCursor, toggleOverview, togglePresenterLayout } from '../state'
import { configs } from '../env'
import { useNav } from '../composables/useNav'
import { getSlidePath } from '../logic/slides'
import { useDrawings } from '../composables/useDrawings'
import Settings from './Settings.vue'
import MenuButton from './MenuButton.vue'
import VerticalDivider from './VerticalDivider.vue'
import IconButton from './IconButton.vue'

import CustomNavControls from '#slidev/custom-nav-controls'

const props = defineProps({
  persist: {
    default: false,
  },
})

const {
  currentRoute,
  currentSlideNo,
  hasNext,
  hasPrev,
  isEmbedded,
  isPresenter,
  isPresenterAvailable,
  next,
  prev,
  total,
} = useNav()
const {
  brush,
  drawingEnabled,
} = useDrawings()

const md = breakpoints.smaller('md')
const { isFullscreen, toggle: toggleFullscreen } = fullscreen

const presenterPassword = computed(() => currentRoute.value.query.password)
const query = computed(() => presenterPassword.value ? `?password=${presenterPassword.value}` : '')
const presenterLink = computed(() => `${getSlidePath(currentSlideNo.value, true)}${query.value}`)
const nonPresenterLink = computed(() => `${getSlidePath(currentSlideNo.value, false)}${query.value}`)

const root = ref<HTMLDivElement>()
function onMouseLeave() {
  if (root.value && activeElement.value && root.value.contains(activeElement.value))
    activeElement.value.blur()
}

const barStyle = computed(() => props.persist
  ? 'text-$slidev-controls-foreground bg-transparent'
  : 'rounded-md bg-main shadow dark:border dark:border-main')

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
      <IconButton v-if="!isEmbedded" :title="isFullscreen ? 'Close fullscreen' : 'Enter fullscreen'" @click="toggleFullscreen">
        <carbon:minimize v-if="isFullscreen" />
        <carbon:maximize v-else />
      </IconButton>
      <IconButton :class="{ disabled: !hasPrev }" title="Go to previous slide" @click="prev">
        <carbon:arrow-left />
      </IconButton>
      <IconButton :class="{ disabled: !hasNext }" title="Go to next slide" @click="next">
        <carbon:arrow-right />
      </IconButton>
      <IconButton v-if="!isEmbedded" title="Show slide overview" @click="toggleOverview()">
        <carbon:apps />
      </IconButton>
      <IconButton
        v-if="!isColorSchemaConfigured"
        :title="isDark ? 'Switch to light mode theme' : 'Switch to dark mode theme'"
        @click="toggleDark()"
      >
        <carbon-moon v-if="isDark" />
        <carbon-sun v-else />
      </IconButton>

      <VerticalDivider />

      <template v-if="!isEmbedded">
        <template v-if="!isPresenter && !md && RecordingControls">
          <RecordingControls />
          <VerticalDivider />
        </template>

        <IconButton
          v-if="isPresenter"
          :title="showPresenterCursor ? 'Hide presenter cursor' : 'Show presenter cursor'"
          @click="showPresenterCursor = !showPresenterCursor"
        >
          <ph-cursor-fill v-if="showPresenterCursor" />
          <ph-cursor-duotone v-else />
        </IconButton>
      </template>

      <template v-if="__SLIDEV_FEATURE_DRAWINGS__ && (!configs.drawings.presenterOnly || isPresenter) && !isEmbedded">
        <IconButton class="relative" :title="drawingEnabled ? 'Hide drawing toolbar' : 'Show drawing toolbar'" @click="drawingEnabled = !drawingEnabled">
          <carbon:pen />
          <div
            v-if="drawingEnabled"
            class="absolute left-1 right-1 bottom-0 h-0.7 rounded-full"
            :style="{ background: brush.color }"
          />
        </IconButton>
        <VerticalDivider />
      </template>

      <template v-if="!isEmbedded">
        <RouterLink v-if="isPresenter" :to="nonPresenterLink" class="slidev-icon-btn" title="Play Mode">
          <carbon:presentation-file />
        </RouterLink>
        <RouterLink v-if="__SLIDEV_FEATURE_PRESENTER__ && isPresenterAvailable" :to="presenterLink" class="slidev-icon-btn" title="Presenter Mode">
          <carbon:user-speaker />
        </RouterLink>

        <IconButton
          v-if="__DEV__ && __SLIDEV_FEATURE_EDITOR__"
          :title="showEditor ? 'Hide editor' : 'Show editor'"
          class="lt-md:hidden"
          @click="showEditor = !showEditor"
        >
          <carbon:text-annotation-toggle />
        </IconButton>

        <IconButton v-if="isPresenter" title="Toggle Presenter Layout" class="aspect-ratio-initial" @click="togglePresenterLayout">
          <carbon:template />
          {{ presenterLayout }}
        </IconButton>
      </template>
      <template v-if="!__DEV__">
        <IconButton v-if="configs.download" title="Download as PDF" @click="downloadPDF">
          <carbon:download />
        </IconButton>
      </template>

      <IconButton
        v-if="!isPresenter && configs.info && !isEmbedded"
        title="Show info"
        @click="showInfoDialog = !showInfoDialog"
      >
        <carbon:information />
      </IconButton>

      <template v-if="!isPresenter && !isEmbedded">
        <MenuButton>
          <template #button>
            <IconButton title="Adjust settings">
              <carbon:settings-adjust />
            </IconButton>
          </template>
          <template #menu>
            <Settings />
          </template>
        </MenuButton>
      </template>

      <VerticalDivider v-if="!isEmbedded" />

      <div class="h-40px flex" p="l-1 t-0.5 r-2" text="sm leading-2">
        <div class="my-auto">
          {{ currentSlideNo }}
          <span class="opacity-50">/ {{ total }}</span>
        </div>
      </div>

      <CustomNavControls />
    </div>
  </nav>
</template>../composables/drawings
