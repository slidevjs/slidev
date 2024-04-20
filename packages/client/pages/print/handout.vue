<script setup lang="ts">
import { useNav } from '../../composables/useNav'
import { useSlideInfo } from '../../composables/useSlideInfo'
import { usePrintContext } from '../../composables/usePrintContext'
import { configs } from '../../env'
import SlideContainer from '../../internals/SlideContainer.vue'
import NoteStatic from '../../internals/NoteStatic.vue'
import SlidesPrintShow from '../../internals/SlidesPrintShow.vue'

const { isPrintWithClicks, clicksContext, total, currentSlideNo } = useNav()
const { printState } = usePrintContext(1)
const { info } = useSlideInfo(1)
</script>

<template>
  <div class="text-black w-min">
    <div v-if="printState === 'before'" class="handout-page px-25">
      <div class="text-5xl text-black mt-48">
        {{ configs.title }}
      </div>
      <div v-if="configs.info" class="mt-10" v-html="configs.info" />
      <div v-if="info?.frontmatter.author" class="mt-5">
        {{ info.frontmatter.author }}
      </div>
    </div>
    <div v-show="printState === 'slides'" class="handout-page px-8 py-[15mm]">
      <div class="tabular-nums mb-1">
        <span v-if="isPrintWithClicks" class="op-70 text-sm">
          Page
        </span>
        {{ currentSlideNo }} / {{ total }}
        <span v-if="isPrintWithClicks && clicksContext.total" class="ml-4">
          <span class="op-70 text-sm">
            Clicks
          </span>
          {{ clicksContext.current }} / {{ clicksContext.total }}
        </span>
      </div>

      <SlideContainer :width="728" class="light:children:(b b-dark) dark:text-white !overflow-visible">
        <SlidesPrintShow />
      </SlideContainer>

      <NoteStatic
        :key="currentSlideNo"
        class="mt-10 mx-2 text-lg"
        :no="currentSlideNo"
        :clicks-context="isPrintWithClicks ? clicksContext : undefined"
      />

      <div class="absolute bottom-4 left-6 right-6 px-2 pt-2 b-t b-gray">
        <div v-if="configs.title" class="text-right text-sm">
          {{ configs.title }}
        </div>
        <div class="text-right text-sm tabular-nums">
          {{ currentSlideNo }} / {{ total }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@page {
  size: A4;
  margin: 0;
}

.handout-page {
  width: 794px;
  height: 1123px;
  overflow: hidden;
  break-before: page;
  position: relative;
  background-color: white;
}

.slidev-note-click-mark.slidev-note-click-mark-past {
  filter: none;
  opacity: 0.5;
}
.slidev-note-click-mark.slidev-note-click-mark-next {
  opacity: 0.5;
}
</style>
