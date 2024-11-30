<script setup lang="ts">
import type { CodeRunnerOutputs, RawAtValue } from '@slidev/types'
import { debounce, toArray } from '@antfu/utils'
import { useVModel } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, shallowRef, toValue, watch, watchSyncEffect } from 'vue'
import { useNav } from '../composables/useNav'
import { useSlideContext } from '../context'
import { makeId } from '../logic/utils'
import setupCodeRunners from '../setup/code-runners'
import DomElement from './DomElement.vue'
import IconButton from './IconButton.vue'

const props = defineProps<{
  modelValue: string
  lang: string
  autorun: boolean | 'once'
  height?: string
  showOutputAt?: RawAtValue
  highlightOutput: boolean
  runnerOptions?: Record<string, unknown>
}>()

const emit = defineEmits(['update:modelValue'])

const { isPrintMode } = useNav()

const code = useVModel(props, 'modelValue', emit)

const { $renderContext, $clicksContext } = useSlideContext()
const disabled = computed(() => !['slide', 'presenter'].includes($renderContext.value))

const autorun = isPrintMode.value ? 'once' : props.autorun
const isRunning = ref(autorun)
const outputs = shallowRef<CodeRunnerOutputs>()
const runCount = ref(0)
const highlightFn = ref<(code: string, lang: string) => string>()

const hidden = ref(props.showOutputAt)
if (props.showOutputAt) {
  const id = makeId()
  onMounted(() => {
    const info = $clicksContext.calculate(props.showOutputAt)
    if (info) {
      $clicksContext.register(id, info)
      watchSyncEffect(() => {
        hidden.value = !info.isActive.value
      })
    }
    else {
      hidden.value = false
    }
  })
  onUnmounted(() => $clicksContext.unregister(id))
}

const triggerRun = debounce(200, async () => {
  if (disabled.value)
    return

  const { highlight, run } = await setupCodeRunners()
  highlightFn.value = highlight

  const setAsRunning = setTimeout(() => {
    isRunning.value = true
  }, 500)

  outputs.value = await run(code.value, props.lang, props.runnerOptions ?? {})
  runCount.value += 1
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
    v-show="!hidden"
    class="relative flex flex-col rounded-b border-t border-main"
    :style="{ height: props.height }"
    data-waitfor=".slidev-runner-output"
  >
    <div v-if="disabled" class="text-sm text-center opacity-50">
      Code is disabled in the "{{ $renderContext }}" mode
    </div>
    <div v-else-if="isRunning" class="text-sm text-center opacity-50">
      Running...
    </div>
    <div v-else-if="!outputs" class="text-sm text-center opacity-50">
      Click the play button to run the code
    </div>
    <div v-else :key="`run-${runCount}`" class="slidev-runner-output">
      <template v-for="output, _idx1 of toArray(toValue(outputs))" :key="_idx1">
        <div v-if="'html' in output" v-html="output.html" />
        <div v-else-if="'error' in output" class="text-red-500">
          {{ output.error }}
        </div>
        <DomElement v-else-if="'element' in output" :element="output.element" />
        <div v-else class="output-line">
          <template
            v-for="item, idx2 in toArray(output)"
            :key="idx2"
          >
            <span
              v-if="item.highlightLang && highlightFn"
              class="highlighted"
              v-html="highlightFn(item.text, item.highlightLang)"
            />
            <span v-else :class="item.class">{{ item.text }}</span>
            <span v-if="idx2 < toArray(output).length - 1" class="separator">,</span>
          </template>
        </div>
      </template>
    </div>
  </div>
  <div v-if="code.trim()" class="absolute right-1 top-1 max-h-full flex gap-1">
    <IconButton class="w-8 h-8 max-h-full flex justify-center items-center" title="Run code" @click="triggerRun">
      <div class="i-carbon:play" />
    </IconButton>
  </div>
</template>

<style lang="postcss">
.slidev-runner-output {
  @apply px-5 py-3 flex-grow text-xs leading-[.8rem] font-$slidev-code-font-family select-text;
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
