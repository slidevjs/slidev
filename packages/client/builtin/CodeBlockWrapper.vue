<!--
Line highlighting for code blocks.
(auto transformed, you don't need to use this component directly)

Usage:

```ts {1,3-5|2,4}
const your_code = 'here'
```

Learn more: https://sli.dev/guide/syntax.html#line-highlighting
-->

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { computed, inject, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { CLASS_VCLICK_HIDDEN, CLICKS_MAX } from '../constants'
import { useSlideContext } from '../context'
import { configs } from '../env'
import TitleIcon from '../internals/TitleIcon.vue'
import { makeId, updateCodeHighlightRange } from '../logic/utils'

const props = defineProps({
  ranges: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  finally: {
    type: [String, Number],
    default: 'last',
  },
  startLine: {
    type: Number,
    default: 1,
  },
  lines: {
    type: Boolean,
    default: configs.lineNumbers,
  },
  at: {
    type: [String, Number],
    default: '+1',
  },
  maxHeight: {
    type: String,
    default: undefined,
  },
  title: {
    type: String,
    default: undefined,
  },
})

const { $clicksContext: clicks } = useSlideContext()
const el = ref<HTMLDivElement>()
const id = makeId()

onUnmounted(() => {
  clicks!.unregister(id)
})

watchEffect(() => {
  el.value?.classList.toggle('slidev-code-line-numbers', props.lines)
})

onMounted(() => {
  if (!clicks || !props.ranges?.length)
    return

  const clicksInfo = clicks.calculateSince(props.at, props.ranges.length - 1)
  clicks.register(id, clicksInfo)

  const index = computed(() => clicksInfo ? Math.max(0, clicks.current - clicksInfo.start + 1) : CLICKS_MAX)

  const finallyRange = computed(() => {
    return props.finally === 'last' ? props.ranges.at(-1) : props.finally.toString()
  })

  watchEffect(() => {
    if (!el.value)
      return

    let rangeStr = props.ranges[index.value] ?? finallyRange.value
    const hide = rangeStr === 'hide'
    el.value.classList.toggle(CLASS_VCLICK_HIDDEN, hide)
    if (hide)
      rangeStr = props.ranges[index.value + 1] ?? finallyRange.value

    const pre = el.value.querySelector('.shiki')!
    const lines = Array.from(pre.querySelectorAll('code > .line'))
    const linesCount = lines.length

    updateCodeHighlightRange(
      rangeStr,
      linesCount,
      props.startLine,
      no => [lines[no]],
    )

    // Scroll to the highlighted line if `maxHeight` is set
    if (props.maxHeight) {
      const highlightedEls = Array.from(pre.querySelectorAll('.line.highlighted')) as HTMLElement[]
      const height = highlightedEls.reduce((acc, el) => el.offsetHeight + acc, 0)
      if (height > el.value.offsetHeight) {
        highlightedEls[0].scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      else if (highlightedEls.length > 0) {
        const middleEl = highlightedEls[Math.round((highlightedEls.length - 1) / 2)]
        middleEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  })
})

const { copied, copy } = useClipboard()

function copyCode() {
  const code = el.value?.querySelector('.slidev-code')?.textContent
  if (code)
    copy(code)
}

// code block title
const activeTitle = inject<Ref<string> | null>('activeTitle', null)

const isBlockTitleShow = computed(() => {
  return activeTitle === null && props.title
})
</script>

<template>
  <div
    ref="el"
    class="slidev-code-wrapper relative group"
    :class="{
      'slidev-code-line-numbers': props.lines,
      'active': activeTitle === title,
    }"
    :style="{
      'max-height': props.maxHeight,
      'overflow-y': props.maxHeight ? 'scroll' : undefined,
      '--start': props.startLine,
    }"
    :data-title="title"
  >
    <div v-if="isBlockTitleShow" class="slidev-code-block-title">
      <TitleIcon :title="title" />
      <div class="leading-1em">
        {{ title.replace(/~([^~]+)~/g, '').trim() }}
      </div>
    </div>
    <slot />
    <button
      v-if="configs.codeCopy"
      class="slidev-code-copy absolute right-0 transition opacity-0 group-hover:opacity-20 hover:!opacity-100"
      :class="isBlockTitleShow ? 'top-10' : 'top-0'"
      :title="copied ? 'Copied' : 'Copy'" @click="copyCode()"
    >
      <ph-check-circle v-if="copied" class="p-2 w-8 h-8" />
      <ph-clipboard v-else class="p-2 w-8 h-8" />
    </button>
  </div>
</template>
