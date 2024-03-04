<script setup lang="ts">
import { debounce } from '@antfu/utils'
import { useVModel } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { isDark } from '../logic/dark'
import { isPrintMode } from '../logic/nav'
import { runJavaScript } from '../logic/runCode'
import { useSlideContext } from '../context'
import IconButton from './IconButton.vue'

const props = defineProps<{
  modelValue: string
  lang: string
  autorun?: boolean | 'once'
  height?: string
}>()
const emit = defineEmits(['update:modelValue'])
const code = useVModel(props, 'modelValue', emit)

const { $renderContext } = useSlideContext()
const disabled = computed(() => !['slide', 'presenter'].includes($renderContext.value))

const autorun = isPrintMode.value ? 'once' : props.autorun
const output = ref(autorun ? '_running' : '_empty')

let shikiModule: typeof import('#slidev/shiki') | undefined
let tsModule: typeof import('typescript') | undefined

const run = debounce(200, async () => {
  if (disabled.value)
    return

  const setAsRunning = setTimeout(() => {
    output.value = '_running'
  }, 500)

  const { shiki, themes } = (shikiModule ??= await import('#slidev/shiki'))
  const highlighter = await shiki
  const highlight = (code: string) => highlighter.codeToHtml(code, {
    lang: 'javascript',
    theme: typeof themes === 'string'
      ? themes
      : isDark.value
        ? themes.dark || 'vitesse-dark'
        : themes.light || 'vitesse-light',
  })

  const { transpile } = (tsModule ??= await import('typescript'))
  const js = props.lang === 'typescript'
    ? transpile(code.value, {
      module: tsModule.ModuleKind.ESNext,
    })
    : code.value

  output.value = (await runJavaScript(js)).flatMap(
    ([type, content]) => [
      `<div class="output-line">`,
      `<span class="decorator">[</span>`,
      `<span class="log-type ${type}">${type}</span>`,
      `<span class="decorator">]:&nbsp;</span>`,
      `<div class="select-text">`,
      content.map(highlight).join('<span class="decorator">, </span>'),
      `</div>`,
      `</div>`,
    ],
  ).join('')

  clearTimeout(setAsRunning)
})

if (autorun === 'once')
  run()
else if (autorun)
  watch(code, run, { immediate: true })
</script>

<template>
  <div
    class="relative flex flex-col px-2 py-1 rounded-b bg-$slidev-code-background"
    :style="{ height: props.height }"
    data-waitfor=".output"
  >
    <div v-if="disabled" class="text-sm text-center opacity-50">
      Code is disabled in the "{{ $renderContext }}" mode
    </div>
    <div v-else-if="output === '_empty'" class="text-sm text-center opacity-50">
      Click the play button to run the code
    </div>
    <div v-else-if="output === '_running'" class="text-sm text-center opacity-50 running">
      Running...
    </div>
    <template v-else>
      <div class="mb-1 -mt-1 text-xs font-bold text-primary">
        OUTPUT
      </div>
      <div class="flex-grow ml-1 text-xs leading-[.8rem] font-$slidev-code-font-family output" v-html="output" />
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

<style scoped lang="postcss">
.output :deep(.log-type) {
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

.output :deep(.decorator) {
  @apply op-40;
}

.output :deep(.output-line) {
  @apply my-1 flex w-full;
}

.output :deep(pre) {
  @apply inline text-wrap !bg-transparent;
}
</style>
