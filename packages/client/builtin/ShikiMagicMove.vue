<script setup lang="ts">
import type { KeyedTokensInfo } from 'shiki-magic-move/types'
import type { PropType } from 'vue'
import { sleep } from '@antfu/utils'
import lz from 'lz-string'
import { ShikiMagicMovePrecompiled } from 'shiki-magic-move/vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useNav } from '../composables/useNav'
import { CLICKS_MAX } from '../constants'
import { useSlideContext } from '../context'
import { configs } from '../env'
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
})

const steps = JSON.parse(lz.decompressFromBase64(props.stepsLz)) as KeyedTokensInfo[]
const { $clicksContext: clicks, $scale: scale, $zoom: zoom } = useSlideContext()
const { isPrintMode } = useNav()
const id = makeId()

const stepIndex = ref(0)
const container = ref<HTMLElement>()

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
  <div ref="container" class="slidev-code-wrapper slidev-code-magic-move relative">
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
  </div>
</template>

<style>
.slidev-code-magic-move .shiki-magic-move-enter-from,
.slidev-code-magic-move .shiki-magic-move-leave-to {
  opacity: 0;
}
</style>
