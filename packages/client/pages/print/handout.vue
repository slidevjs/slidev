<script setup lang="ts">
import { useNav } from '../../composables/useNav'
import { useSlideInfo } from '../../composables/useSlideInfo'
import { configs } from '../../env'
import PrintSlides from '../../internals/PrintSlides.vue'
import SlideContainer from '../../internals/SlideContainer.vue'
import SlideWrapper from '../../internals/SlideWrapper.vue'
import NoteStatic from '../../internals/NoteStatic.vue'

import GlobalTop from '#slidev/global-components/top'
import GlobalBottom from '#slidev/global-components/bottom'

const { isPrintWithClicks } = useNav()
const { info } = useSlideInfo(1)
</script>

<template>
  <div class="text-black w-min">
    <div class="handout-page px-25 b b-black">
      <div class="text-5xl text-black mt-48">
        {{ configs.title }}
      </div>
      <div v-if="configs.info" class="mt-10" v-html="configs.info" />
      <div v-if="info?.frontmatter.author" class="mt-5">
        {{ info.frontmatter.author }}
      </div>
    </div>
    <PrintSlides v-slot="{ nav, route }">
      <div class="handout-page px-8 py-[15mm] b b-black">
        <div class="tabular-nums mb-1">
          <span v-if="isPrintWithClicks" class="op-70 text-sm">
            Page
          </span>
          {{ route.no }} / {{ nav.total }}
          <span v-if="isPrintWithClicks && nav.clicksContext.value.total" class="ml-4">
            <span class="op-70 text-sm">
              Clicks
            </span>
            {{ nav.clicksContext.value.current }} / {{ nav.clicksContext.value.total }}
          </span>
        </div>

        <SlideContainer :width="728" class="light:children:(border b-dark)">
          <GlobalBottom />

          <SlideWrapper
            :is="route.component!"
            :clicks-context="nav.clicksContext.value"
            :route="route"
          />

          <GlobalTop />
        </SlideContainer>

        <NoteStatic
          class="mt-10 mx-2 text-lg"
          :no="route.no"
          :clicks-context="isPrintWithClicks ? nav.clicksContext.value : undefined"
        />

        <div class="absolute bottom-4 left-6 right-6 px-2 pt-2 b-t b-gray">
          <div v-if="configs.title" class="text-right text-sm">
            {{ configs.title }}
          </div>
          <div class="text-right text-sm tabular-nums">
            {{ route.no }} / {{ nav.total }}
          </div>
        </div>
      </div>
    </PrintSlides>
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
}

.slidev-note-click-mark.slidev-note-click-mark-past {
  filter: none;
  opacity: 0.5;
}
.slidev-note-click-mark.slidev-note-click-mark-next {
  opacity: 0.5;
}
</style>
