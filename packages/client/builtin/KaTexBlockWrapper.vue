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
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import type { PropType } from 'vue'
import { parseRangeString } from '@slidev/parser'
import { CLASS_VCLICK_HIDDEN, CLASS_VCLICK_TARGET } from '../constants'
import { makeId } from '../logic/utils'
import { useSlideContext } from '../context'

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
  at: {
    type: [String, Number],
    default: '+1',
  },
})

const { $clicksContext: clicks } = useSlideContext()
const el = ref<HTMLDivElement>()
const id = makeId()

onUnmounted(() => {
  clicks!.unregister(id)
})

onMounted(() => {
  if (!clicks || !props.ranges?.length)
    return

  const { start, end, delta } = clicks.resolve(props.at, props.ranges.length - 1)
  clicks.register(id, { max: end, delta })

  const index = computed(() => Math.max(0, clicks.current - start + 1))

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
    const highlights: number[] = parseRangeString(lines.length + startLine - 1, rangeStr)
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
  <div ref="el" class="slidev-katex-wrapper">
    <slot />
  </div>
</template>
