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
import type * as monaco from 'monaco-editor'
import { computed, nextTick, onMounted, ref } from 'vue'
import { debounce } from '@antfu/utils'
import lz from 'lz-string'
import { makeId } from '../logic/utils'

const props = withDefaults(defineProps<{
  codeLz: string
  diffLz?: string
  lang?: string
  readonly?: boolean
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
  height?: number | string // Posible values: 'initial', 'auto', '100%', '200px', etc.
  editorOptions?: monaco.editor.IEditorOptions
  ata?: boolean
  runnable?: boolean
  autorun?: boolean | 'once'
  outputHeight?: number | undefined
}>(), {
  codeLz: '',
  lang: 'typescript',
  readonly: false,
  lineNumbers: 'off',
  height: 'initial',
  ata: true,
  runnable: false,
  autorun: true,
})

const code = lz.decompressFromBase64(props.codeLz).trimEnd()
const diff = props.diffLz && lz.decompressFromBase64(props.diffLz).trimEnd()

const langMap: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
}
const lang = langMap[props.lang] ?? props.lang
const extMap: Record<string, string> = {
  typescript: 'mts',
  javascript: 'mjs',
  ts: 'mts',
  js: 'mjs',
}
const ext = extMap[props.lang] ?? props.lang

const outer = ref<HTMLDivElement>()
const container = ref<HTMLDivElement>()

const contentHeight = ref(0)
const initialHeight = ref<number>()
const height = computed(() => {
  if (props.height === 'auto')
    return `${contentHeight.value}px`
  if (props.height === 'initial')
    return `${initialHeight.value}px`
  return props.height
})

onMounted(async () => {
  // Lazy load monaco, so it will be bundled in async chunk
  const { default: setup } = await import('../setup/monaco')
  const { ata, monaco } = await setup()
  const model = monaco.editor.createModel(code, lang, monaco.Uri.parse(`file:///${makeId()}.${ext}`))
  const commonOptions = {
    automaticLayout: true,
    readOnly: props.readonly,
    lineNumbers: props.lineNumbers,
    minimap: { enabled: false },
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    padding: { top: 10, bottom: 10 },
    lineNumbersMinChars: 3,
    bracketPairColorization: { enabled: false },
    tabSize: 2,
    fontSize: 11.5,
    fontFamily: 'var(--slidev-code-font-family)',
    scrollBeyondLastLine: false,
    ...props.editorOptions,
  } satisfies monaco.editor.IStandaloneEditorConstructionOptions & monaco.editor.IDiffEditorConstructionOptions

  let editableEditor: monaco.editor.IStandaloneCodeEditor
  if (diff) {
    const diffModel = monaco.editor.createModel(diff, lang, monaco.Uri.parse(`file:///${makeId()}.${ext}`))
    const editor = monaco.editor.createDiffEditor(container.value!, {
      renderOverviewRuler: false,
      ...commonOptions,
    })
    editor.setModel({
      original: model,
      modified: diffModel,
    })
    const originalEditor = editor.getOriginalEditor()
    const modifiedEditor = editor.getModifiedEditor()
    const onContentSizeChange = () => {
      const newHeight = Math.max(originalEditor.getContentHeight(), modifiedEditor.getContentHeight()) + 4
      initialHeight.value ??= newHeight
      contentHeight.value = newHeight
      nextTick(() => editor.layout())
    }
    originalEditor.onDidContentSizeChange(onContentSizeChange)
    modifiedEditor.onDidContentSizeChange(onContentSizeChange)
    editableEditor = modifiedEditor
  }
  else {
    const editor = monaco.editor.create(container.value!, {
      model,
      lineDecorationsWidth: 0,
      ...commonOptions,
    })
    editor.onDidContentSizeChange((e) => {
      const newHeight = e.contentHeight + 4
      initialHeight.value ??= newHeight
      contentHeight.value = newHeight
      nextTick(() => editableEditor.layout())
    })
    editableEditor = editor
  }
  if (props.ata) {
    ata(editableEditor.getValue())
    editableEditor.onDidChangeModelContent(debounce(1000, () => {
      ata(editableEditor.getValue())
    }))
  }
  const originalLayoutContentWidget = editableEditor.layoutContentWidget.bind(editableEditor)
  editableEditor.layoutContentWidget = (widget: any) => {
    originalLayoutContentWidget(widget)
    const id = widget.getId()
    if (id === 'editor.contrib.resizableContentHoverWidget') {
      widget._resizableNode.domNode.style.transform = widget._positionPreference === 1
        ? /* ABOVE */ `translateY(calc(100% * (var(--slidev-slide-scale) - 1)))`
        : /* BELOW */ `` // reset
    }
  }
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
  <div class="relative">
    <div ref="outer" class="slidev-monaco-container" :style="{ height }">
      <div ref="container" class="absolute inset-0.5" />
    </div>
    <template v-if="props.runnable">
      <div
        class="relative px-2 py-1 rounded-b bg-[var(--slidev-code-background)]"
        :style="{ height: props.outputHeight && `${1.25 + 0.8 * props.outputHeight}em` }"
      >
        <div v-if="result === 'empty'" class="text-sm text-center opacity-50">
          Click the play button to run the code
        </div>
        <div v-else-if="result === 'running'" class="text-sm text-center opacity-50">
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
            <div v-if="result.output.length === 0" class="opacity-50">
              (empty)
            </div>
          </div>
        </div>
      </div>
      <div v-if="code.trim()" class="absolute right-3 top-4 max-h-full flex gap-1">
        <button class="code-action" :disabled="result === 'running'" @click="run">
          <carbon:renew v-if="props.autorun === true" />
          <carbon:play-filled-alt v-else />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="postcss">
.code-action {
  @apply w-8 h-8 max-h-full;
  @apply flex justify-center items-center;
  @apply rounded bg-gray-100 text-gray-500;
  @apply hover:(bg-gray-200);
}
</style>
