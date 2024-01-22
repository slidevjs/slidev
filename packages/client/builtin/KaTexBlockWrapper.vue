<!--
Line highlighting for KaTex blocks/
(auto transformed, you don't need to use this component directly)

Usage:
$$ {1|3|all}
\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}
$$

Learn more: https://sli.dev/guide/syntax.html#latex-line-highlighting
-->

<script setup lang="ts">
import { range, remove } from '@antfu/utils'
import { computed, getCurrentInstance, inject, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { parseRangeString } from '@slidev/parser'
import { CLASS_VCLICK_TARGET, injectionClicks, injectionClicksDisabled, injectionClicksElements } from '../constants'
import { makeId } from '../logic/utils'

const props = defineProps({
  ranges: {
    default: () => [],
  },
  startLine: {
    type: Number,
    default: 1,
  },
  at: {
    type: Number,
    default: undefined,
  },
})

const clicks = inject(injectionClicks)
const elements = inject(injectionClicksElements)
const disabled = inject(injectionClicksDisabled)

const el = ref<HTMLDivElement>()
const vm = getCurrentInstance()

onMounted(() => {
  const prev = props.at == null ? elements?.value.length : props.at
  const index = computed(() => {
    if (disabled?.value)
      return props.ranges.length - 1
    return Math.min(Math.max(0, (clicks?.value || 0) - (prev || 0)), props.ranges.length - 1)
  })
  const rangeStr = computed(() => props.ranges[index.value] || '')
  if (props.ranges.length >= 2 && !disabled?.value) {
    const id = makeId()
    const ids = range(props.ranges.length - 1).map(i => id + i)
    if (elements?.value) {
      elements.value.push(...ids)
      onUnmounted(() => ids.forEach(i => remove(elements.value, i)), vm)
    }
  }

  watchEffect(() => {
    if (!el.value)
      return
    // KaTeX equations have col-align-XXX as parent
    const equationParents = el.value.querySelectorAll('.mtable > [class*=col-align]')
    if (!equationParents)
      return

    // For each row we extract the individual equation rows
    const equationRowsOfEachParent = Array.from(equationParents)
      .map(item => Array.from(item.querySelectorAll(':scope > .vlist-t > .vlist-r > .vlist > span > .mord')))
    // This list maps rows from different parents to line them up
    const lines: Element[][] = []
    for (const equationRowParent of equationRowsOfEachParent) {
      equationRowParent.forEach((equationRow, idx) => {
        if (!equationRow)
          return
        if (Array.isArray(lines[idx]))
          lines[idx].push(equationRow)
        else
          lines[idx] = [equationRow]
      })
    }

    const startLine = props.startLine
    const highlights: number[] = parseRangeString(lines.length + startLine - 1, rangeStr.value)
    lines.forEach((line, idx) => {
      const highlighted = highlights.includes(idx + startLine)
      line.forEach((node) => {
        node.classList.toggle(CLASS_VCLICK_TARGET, true)
        node.classList.toggle('highlighted', highlighted)
        node.classList.toggle('dishonored', !highlighted)
      })
    })
  })
})
</script>

<template>
  <div
    ref="el" class="slidev-katex-wrapper"
  >
    <slot />
  </div>
</template>
