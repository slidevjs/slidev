<!--
Monaco Editor
(auto transformed, you don't need to use this component directly)

Usage:

```ts {monaco}
const your_code = 'here'
```

Learn more: https://sli.dev/guide/syntax.html#monaco-editor
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { notNullish } from '@antfu/utils'
import { decode } from 'js-base64'
import { nanoid } from 'nanoid'
import type * as monaco from 'monaco-editor'
import type { RunResult } from '@slidev/types'
import { isDark } from '../logic/dark'

const props = withDefaults(defineProps<{
  code: string
  diff?: string
  lang?: string
  readonly?: boolean
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
  height?: number | string
  editorOptions?: monaco.editor.IEditorOptions
  runnable?: boolean
  autorun?: boolean | 'once'
  outputHeight?: number | undefined
}>(), {
  code: '',
  lang: 'typescript',
  readonly: false,
  lineNumbers: 'off',
  height: 'auto',
  runnable: false,
  autorun: true,
})

const id = nanoid()
const code = ref(decode(props.code).trimEnd())
const diff = ref(props.diff ? decode(props.diff).trimEnd() : null)
const lineHeight = +(getComputedStyle(document.body).getPropertyValue('--slidev-code-line-height') || '18').replace('px', '') || 18
const editorHeight = ref(0)
const calculatedHeight = computed(() => code.value.split(/\r?\n/g).length * lineHeight)
const height = computed(() => {
  return props.height === 'auto' ? `${Math.max(calculatedHeight.value, editorHeight.value) + 20}px` : props.height
})

const iframe = ref<HTMLIFrameElement>()

const cssVars = [
  '--slidev-code-font-size',
  '--slidev-code-font-family',
  '--slidev-code-background',
  '--slidev-code-line-height',
  '--slidev-code-padding',
  '--slidev-code-margin',
  '--slidev-code-radius',
]

function getStyleObject(el: Element) {
  const object: Record<string, string> = {}
  const style = getComputedStyle(el)
  for (const v of cssVars)
    object[v] = style.getPropertyValue(v)
  return object
}

onMounted(() => {
  const frame = iframe.value!
  frame.setAttribute('sandbox', [
    'allow-forms',
    'allow-modals',
    'allow-pointer-lock',
    'allow-popups',
    'allow-same-origin',
    'allow-scripts',
    'allow-top-navigation-by-user-activation',
  ].join(' '))

  let src = __DEV__
    ? `${location.origin}${__SLIDEV_CLIENT_ROOT__}/`
    : import.meta.env.BASE_URL
  src += `iframes/monaco/index.html?id=${id}&lineNumbers=${props.lineNumbers}&lang=${props.lang}`
  if (diff.value)
    src += '&diff=1'
  frame.src = src

  frame.style.backgroundColor = 'transparent'
})

function post(payload: any) {
  iframe.value?.contentWindow?.postMessage(
    JSON.stringify({
      type: 'slidev-monaco',
      data: payload,
      id,
    }),
    location.origin,
  )
}

useEventListener(window, 'message', ({ data: payload }) => {
  if (payload.id !== id)
    return
  if (payload.type === 'slidev-monaco-loaded') {
    if (iframe.value) {
      post({
        code: code.value,
        diff: diff.value,
        lang: props.lang,
        readonly: props.readonly,
        lineNumbers: props.lineNumbers,
        editorOptions: props.editorOptions,
        dark: isDark.value,
        style: Object.entries(getStyleObject(iframe.value)).map(([k, v]) => `${k}: ${v};`).join(''),
      })
    }
    if (props.autorun)
      run()
    return
  }
  if (payload.type !== 'slidev-monaco')
    return
  if (payload.data?.height)
    editorHeight.value = payload.data?.height
  if (notNullish(payload?.data?.code) && code.value !== payload.data.code) {
    code.value = payload.data.code
    if (props.autorun === true)
      run()
  }
  if (notNullish(payload?.data?.diff) && diff.value !== payload.data.diff)
    diff.value = payload.data.diff
})

const result = ref<RunResult | 'running' | 'empty'>(props.autorun ? 'running' : 'empty')

async function run() {
  const setAsRunning = setTimeout(() => {
    result.value = 'running'
  }, 500)
  result.value = await fetch(
    `/__run_code?lang=${encodeURIComponent(props.lang)}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(code.value),
    },
  ).then(r => r.json())
  clearTimeout(setAsRunning)
}

const colorTable = {
  debug: 'text-gray-500',
  info: 'text-blue-500',
  warn: 'text-yellow-500',
  error: 'text-red-500',
}
</script>

<template>
  <div v-if="props.runnable" class="relative">
    <iframe ref="iframe" class="text-base w-full rounded-t" :style="{ height }" />
    <div
      class="relative px-2 pt-1 rounded-b bg-[var(--slidev-code-background)]"
      :style="{ height: props.outputHeight && `${1.25 + 0.8 * props.outputHeight}em` }"
    >
      <div v-if="result === 'empty'" class="text-sm text-center opacity-70">
        Click the play button to run the code
      </div>
      <div v-else-if="result === 'running'" class="text-sm text-center opacity-70">
        Running...
      </div>
      <div v-else-if="result.type === 'error'" class="text-sm text-red-500">
        {{ result.message }}
      </div>
      <div v-else class="flex flex-col h-full -mt-1">
        <div class="text-xs font-[Consolas]">
          OUTPUT
        </div>
        <div class="ml-1 text-xs overflow-auto leading-[.8rem]">
          <pre v-for="line, i of result.output" :key="i" :class="colorTable[line.type]" v-text="line.text" />
        </div>
      </div>
    </div>
    <div v-if="code.trim()" class="absolute right-3 top-4 max-h-full flex gap-1">
      <button class="code-action" :disabled="result === 'running'" @click="run">
        <carbon:renew v-if="props.autorun === true" />
        <carbon:play-filled-alt v-else />
      </button>
    </div>
  </div>
  <iframe v-else ref="iframe" class="text-base w-full rounded" :style="{ height }" />
</template>

<style scoped lang="postcss">
.code-action {
  @apply w-8 h-8 max-h-full;
  @apply flex justify-center items-center;
  @apply rounded bg-gray-100 text-gray-500;
  @apply hover:(bg-gray-200);
}
</style>
