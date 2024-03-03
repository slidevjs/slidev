<script setup lang="ts">
import { ShikiMagicMovePrecompiled } from 'shiki-magic-move/vue'
import type { KeyedTokensInfo } from 'shiki-magic-move/types'
import { onMounted, onUnmounted, ref, watchEffect } from 'vue'
import lz from 'lz-string'
import { useSlideContext } from '../context'
import { makeId } from '../logic/utils'

import 'shiki-magic-move/style.css'

const props = defineProps<{
  stepsLz: string
  at?: string | number
}>()

const steps = JSON.parse(lz.decompressFromBase64(props.stepsLz)) as KeyedTokensInfo[]
const { $clicksContext: clicks, $scale: scale } = useSlideContext()
const id = makeId()
const index = ref(0)

onUnmounted(() => {
  clicks!.unregister(id)
})

onMounted(() => {
  if (!clicks || clicks.disabled)
    return

  const { start, end, delta } = clicks.resolve(props.at || '+1', steps.length - 1)
  clicks.register(id, { max: end, delta })

  watchEffect(() => {
    if (clicks.disabled)
      index.value = steps.length - 1
    else
      index.value = Math.min(Math.max(0, clicks.current - start + 1), steps.length - 1)
  })
})
</script>

<template>
  <div class="slidev-code-wrapper slidev-code-magic-move">
    <ShikiMagicMovePrecompiled
      class="slidev-code relative shiki"
      :steps="steps"
      :step="index"
      :options="{ globalScale: scale }"
    />
  </div>
</template>
