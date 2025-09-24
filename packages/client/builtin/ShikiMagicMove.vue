<script setup lang="ts">
import type { KeyedTokensInfo } from 'shiki-magic-move/types'
import type { PropType } from 'vue'
import { sleep } from '@antfu/utils'
import { useClipboard } from '@vueuse/core'
import lz from 'lz-string'
import { ShikiMagicMovePrecompiled } from 'shiki-magic-move/vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useNav } from '../composables/useNav'
import { CLICKS_MAX } from '../constants'
import { useSlideContext } from '../context'
import { configs } from '../env'
import TitleIcon from '../internals/TitleIcon.vue'
import { makeId, updateCodeHighlightRange } from '../logic/utils'

const props = defineProps({
  at: {
    type: [String, Number],
    default: '+1',
  },
  stepsLz: {
    type: String,
    required: true,
  },
  stepRanges: {
    type: Array as PropType<string[][]>,
    required: true,
  },
  lines: {
    type: Boolean,
    default: configs.lineNumbers,
  },
  title: {
    type: String,
    default: '',
  },
})

const steps = JSON.parse(lz.decompressFromBase64(props.stepsLz)) as KeyedTokensInfo[]
const { $clicksContext: clicks, $scale: scale, $zoom: zoom } = useSlideContext()
const { isPrintMode } = useNav()
const id = makeId()

const stepIndex = ref(0)
const container = ref<HTMLElement>()

const showCopyButton = computed(() => {
  if (!configs.codeCopy)
    return false

  const magicCopy = configs.magicMoveCopy
  if (!magicCopy)
    return false

  if (magicCopy === true || magicCopy === 'always')
    return true

  if (magicCopy === 'final')
    return stepIndex.value === steps.length - 1

  return false
})
const { copied, copy } = useClipboard()

function copyCode() {
  // Use the code property directly from KeyedTokensInfo
  const currentStep = steps[stepIndex.value]
  if (!currentStep || !currentStep.code)
    return

  copy(currentStep.code.trim())
}

// Normalized the ranges, to at least have one range
const ranges = computed(() => props.stepRanges.map(i => i.length ? i : ['all']))

onUnmounted(() => {
  clicks?.unregister(id)
})

onMounted(() => {
  if (!clicks)
    return

  if (ranges.value.length !== steps.length)
    throw new Error('[slidev] The length of stepRanges does not match the length of steps, this is an internal error.')

  const clickCounts = ranges.value.map(s => s.length).reduce((a, b) => a + b, 0)
  const clickInfo = clicks.calculateSince(props.at, clickCounts - 1)
  clicks.register(id, clickInfo)

  watch(
    () => clicks.current,
    () => {
      // Calculate the step and rangeStr based on the current click count
      const clickCount = clickInfo ? clicks.current - clickInfo.start : CLICKS_MAX
      let step = steps.length - 1
      let currentClickSum = 0
      let rangeStr = 'all'
      for (let i = 0; i < ranges.value.length; i++) {
        const current = ranges.value[i]
        if (clickCount < currentClickSum + current.length - 1) {
          step = i
          rangeStr = current[clickCount - currentClickSum + 1]
          break
        }
        currentClickSum += current.length || 1
      }

      nextTick(async () => {
        stepIndex.value = step

        await sleep(0)

        const pre = container.value?.querySelector('.shiki') as HTMLElement
        if (!pre)
          return

        const children = (Array.from(pre.children) as HTMLElement[])
          .slice(1) // Remove the first anchor
          .filter(i => !i.className.includes('shiki-magic-move-leave')) // Filter the leaving elements

        // Group to lines between `<br>`
        const lines = children.reduce((acc, el) => {
          if (el.tagName === 'BR')
            acc.push([])
          else
            acc[acc.length - 1].push(el)
          return acc
        }, [[]] as HTMLElement[][])

        // Update highlight range
        updateCodeHighlightRange(
          rangeStr,
          lines.length,
          1,
          no => lines[no],
        )
      })
    },
    { immediate: true },
  )
})
</script>

<template>
  <div ref="container" class="slidev-code-wrapper slidev-code-magic-move relative group">
    <div v-if="title" class="slidev-code-block-title">
      <TitleIcon :title="title" />
      <div class="leading-1em">
        {{ title.replace(/~([^~]+)~/g, '').trim() }}
      </div>
    </div>
    <ShikiMagicMovePrecompiled
      class="slidev-code relative shiki overflow-visible"
      :steps="steps"
      :step="stepIndex"
      :animate="!isPrintMode"
      :options="{
        globalScale: scale * zoom,
        // TODO: make this configurable later
        duration: 800,
        stagger: 1,
      }"
    />
    <button
      v-if="showCopyButton"
      class="slidev-code-copy absolute right-0 transition opacity-0 group-hover:opacity-20 hover:!opacity-100"
      :class="title ? 'top-10' : 'top-0'"
      :title="copied ? 'Copied' : 'Copy'" @click="copyCode()"
    >
      <ph-check-circle v-if="copied" class="p-2 w-8 h-8" />
      <ph-clipboard v-else class="p-2 w-8 h-8" />
    </button>
  </div>
</template>

<style>
.slidev-code-magic-move .shiki-magic-move-enter-from,
.slidev-code-magic-move .shiki-magic-move-leave-to {
  opacity: 0;
}
</style>
