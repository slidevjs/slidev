<script setup lang="ts">
import { debounce } from '@antfu/utils'
import { useVModel } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import { isDark } from '../logic/dark'
import { isPrintMode } from '../logic/nav'
import type { JavaScriptExecutionLog } from '../logic/runCode'
import { runJavaScript } from '../logic/runCode'
import { useSlideContext } from '../context'
import IconButton from './IconButton.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    lang: string
    autorun?: boolean | 'once'
    height?: string
    highlightOutput?: boolean
  }>(),
  {
    highlightOutput: true,
  },
)

const emit = defineEmits(['update:modelValue'])
const code = useVModel(props, 'modelValue', emit)

const { $renderContext } = useSlideContext()
const disabled = computed(() => !['slide', 'presenter'].includes($renderContext.value))

const autorun = isPrintMode.value ? 'once' : props.autorun
const isRunning = ref(autorun)
const output = shallowRef<JavaScriptExecutionLog[]>()

let tsModule: typeof import('typescript') | undefined

let highlight: ((code: string) => string) | undefined

const run = debounce(200, async () => {
  if (disabled.value)
    return

  const setAsRunning = setTimeout(() => {
    isRunning.value = true
  }, 500)

  if (!highlight && props.highlightOutput) {
    const { shiki, themes } = await import('#slidev/shiki')
    const highlighter = await shiki
    highlight = (code: string) => highlighter.codeToHtml(code, {
      lang: 'javascript',
      theme: typeof themes === 'string'
        ? themes
        : isDark.value
          ? themes.dark || 'vitesse-dark'
          : themes.light || 'vitesse-light',
    })
  }

  const { transpile } = (tsModule ??= await import('typescript'))
  const js = props.lang === 'typescript'
    ? transpile(code.value, {
      module: tsModule.ModuleKind.ESNext,
    })
    : code.value

  // TODO: try catch to render the errors
  output.value = await runJavaScript(js)
  isRunning.value = false
  // ).flatMap(
  //   ([type, content]) => [
  //     `<div class="output-line">`,
  //     `<span class="decorator">[</span>`,
  //     `<span class="log-type ${type}">${type}</span>`,
  //     `<span class="decorator">]:&nbsp;</span>`,
  //     `<div class="select-text">`,
  //     content.map(highlight).join('<span class="decorator">, </span>'),
  //     `</div>`,
  //     `</div>`,
  //   ],
  // ).join('')

  clearTimeout(setAsRunning)
})

if (autorun === 'once')
  run()
else if (autorun)
  watch(code, run, { immediate: true })
</script>

<template>
  <div
    class="relative flex flex-col rounded-b border-t border-main px4 py3"
    :style="{ height: props.height }"
    data-waitfor=".output"
  >
    <div v-if="disabled" class="text-sm text-center opacity-50">
      Code is disabled in the "{{ $renderContext }}" mode
    </div>
    <div v-else-if="isRunning" class="text-sm text-center opacity-50 running">
      Running...
    </div>
    <div v-else-if="!output" class="text-sm text-center opacity-50">
      Click the play button to run the code
    </div>
    <template v-else>
      <div class="flex-grow text-xs leading-[.8rem] font-$slidev-code-font-family slidev-monaco-output">
        <div v-for="log, idx in output" :key="idx" class="flex gap-2">
          <span>
            {{ log.type /* TODO: add better style */ }}:
          </span>
          <div class="flex flex-col">
            <template v-for="c, idx2 in log.content" :key="idx2">
              <div v-if="highlight" v-html="highlight(c)" />
              <pre v-else>{{ c }}</pre>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
  <div v-if="code.trim()" class="absolute right-1 top-1 max-h-full flex gap-1">
    <IconButton
      class="w-8 h-8 max-h-full flex justify-center items-center"
      :title="props.autorun ? 'Rerun' : 'Run code'"
      @click="run"
    >
      <carbon:renew v-if="props.autorun" />
      <carbon:play-filled-alt v-else />
    </IconButton>
  </div>
</template>

<style lang="postcss">
.slidev-monaco-output .log-type {
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

.slidev-monaco-output .decorator {
  @apply op-40;
}

.slidev-monaco-output .output-line {
  @apply my-1 flex w-full;
}

.slidev-monaco-output pre {
  @apply inline text-wrap !bg-transparent;
}
</style>
