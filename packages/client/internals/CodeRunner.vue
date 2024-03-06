<script setup lang="ts">
import { debounce } from '@antfu/utils'
import { useVModel } from '@vueuse/core'
import type { RunnerOutput } from '@slidev/types'
import { computed, ref, shallowRef, watch } from 'vue'
import { isPrintMode } from '../logic/nav'
import { useSlideContext } from '../context'
import setupRunners from '../setup/runners'
import IconButton from './IconButton.vue'

const props = defineProps<{
  modelValue: string
  lang: string
  autorun: boolean | 'once'
  height?: string
  highlightOutput: boolean
  rawMode: boolean
  runnerOptions?: Record<string, unknown>
}>()

const emit = defineEmits(['update:modelValue'])
const code = useVModel(props, 'modelValue', emit)

const { $renderContext } = useSlideContext()
const disabled = computed(() => !['slide', 'presenter'].includes($renderContext.value))

const autorun = isPrintMode.value ? 'once' : props.autorun
const isRunning = ref(autorun)
const output = shallowRef<RunnerOutput>()
const highlightFn = ref<(code: string, lang: string) => string>()

const triggerRun = debounce(200, async () => {
  if (disabled.value)
    return

  const { highlight, run } = await setupRunners()
  highlightFn.value = highlight

  const setAsRunning = setTimeout(() => {
    isRunning.value = true
  }, 500)

  output.value = await run(code.value, props.lang, props.rawMode, props.runnerOptions ?? {})
  isRunning.value = false

  clearTimeout(setAsRunning)
})

if (autorun === 'once')
  triggerRun()
else if (autorun)
  watch(code, triggerRun, { immediate: true })
</script>

<template>
  <div
    class="relative flex flex-col rounded-b border-t border-main"
    :style="{ height: props.height }"
    data-waitfor=".output"
  >
    <div v-if="disabled" class="text-sm text-center opacity-50">
      Code is disabled in the "{{ $renderContext }}" mode
    </div>
    <div v-else-if="isRunning" class="text-sm text-center opacity-50">
      Running...
    </div>
    <div v-else-if="!output" class="text-sm text-center opacity-50">
      Click the play button to run the code
    </div>
    <div v-else class="slidev-runner-output">
      <div v-if="'html' in output" v-html="output.html" />
      <div v-else-if="'error' in output" class="text-red-500">
        {{ output.error }}
      </div>
      <div v-for="line, idx in output" v-else :key="idx" class="output-line">
        <template v-if="!rawMode && line.type">
          <span :class="`log-type ${line.type}`"> {{ line.type }} </span>
          <span class="separator">:</span>
        </template>
        <div class="flex-grow break-anywhere">
          <template v-for="item, idx2 in line.content" :key="idx2">
            <span v-if="'html' in item" v-html="item.html" />
            <template v-else>
              <span
                v-if="item.highlightLang && highlightFn"
                class="highlighted"
                v-html="highlightFn(item.text, item.highlightLang)"
              />
              <span v-else :class="item.class">{{ item.text }}</span>
            </template>
            <span v-if="idx2 < line.content.length - 1" class="separator">,</span>
          </template>
        </div>
      </div>
    </div>
  </div>
  <div v-if="code.trim()" class="absolute right-1 top-1 max-h-full flex gap-1">
    <IconButton class="w-8 h-8 max-h-full flex justify-center items-center" title="Run code" @click="triggerRun">
      <carbon:play />
    </IconButton>
  </div>
</template>

<style lang="postcss">
.slidev-runner-output {
  @apply px-4 py-3 flex-grow text-xs leading-[.8rem] font-$slidev-code-font-family select-text;
}

.slidev-runner-output .log-type {
  @apply font-bold op-70;

  &.DBG {
    @apply text-gray-500;
  }

  &.LOG {
    @apply text-blue-500;
  }

  &.WRN {
    @apply text-orange-500;
  }

  &.ERR {
    @apply text-red-500;
  }
}

.slidev-runner-output .output-line {
  @apply flex my-1 w-full;
}

.slidev-runner-output .separator {
  @apply op-40 mr-1;
}

.slidev-runner-output .highlighted > pre {
  @apply inline text-wrap !bg-transparent;
}
</style>
