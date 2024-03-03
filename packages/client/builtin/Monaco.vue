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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { debounce } from '@antfu/utils'
import lz from 'lz-string'
import { makeId } from '../logic/utils'
import { runJavaScript } from '../logic/runCode'
import { useSlideContext } from '../context'
import { isDark } from '../logic/dark'
import IconButton from '../internals/IconButton.vue'

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
  outputHeight?: string
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

const { $renderContext } = useSlideContext()

const code = ref(lz.decompressFromBase64(props.codeLz).trimEnd())
const diff = props.diffLz && ref(lz.decompressFromBase64(props.diffLz).trimEnd())

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
  const model = monaco.editor.createModel(code.value, lang, monaco.Uri.parse(`file:///${makeId()}.${ext}`))
  model.onDidChangeContent(() => code.value = model.getValue())
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
    const diffModel = monaco.editor.createModel(diff.value, lang, monaco.Uri.parse(`file:///${makeId()}.${ext}`))
    diffModel.onDidChangeContent(() => code.value = model.getValue())
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

const output = ref(props.autorun ? '_running' : '_empty')

let shikiModule: typeof import('#slidev/shiki') | undefined
let tsModule: typeof import('typescript') | undefined

const run = debounce(200, async () => {
  if (!props.runnable || $renderContext.value !== 'slide')
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
  const js = lang === 'typescript' ? transpile(code.value) : code.value

  output.value = (await runJavaScript(js)).map(
    ([type, content]) => [
      `<span class="decorator">[</span>`,
      `<span class="log-type ${type}">${type}</span>`,
      `<span class="decorator">]:</span> `,
      content.map(highlight).join('<span class="decorator">, </span>'),
    ].join(''),
  ).join('<hr>')

  clearTimeout(setAsRunning)
})

if (props.autorun === 'once')
  run()
else if (props.autorun)
  watch(code, run, { immediate: true })
</script>

<template>
  <div class="relative">
    <div ref="outer" class="slidev-monaco-container" :style="{ height }">
      <div ref="container" class="absolute inset-0.5" />
    </div>
    <template v-if="props.runnable">
      <div class="relative flex flex-col px-2 py-1 rounded-b bg-$slidev-code-background" :style="{ height: props.outputHeight }">
        <div v-if="output === '_empty'" class="text-sm text-center opacity-50">
          Click the play button to run the code
        </div>
        <div v-else-if="output === '_running'" class="text-sm text-center opacity-50">
          Running...
        </div>
        <template v-else>
          <div class="mb-1 -mt-1 text-xs font-bold text-primary">
            OUTPUT
          </div>
          <div
            class="flex-grow ml-1 text-xs leading-[.8rem] font-$slidev-code-font-family output"
            v-html="output"
          />
        </template>
      </div>
      <div v-if="code.trim()" class="absolute right-1 top-1 max-h-full flex gap-1">
        <IconButton
          class="w-8 h-8 max-h-full flex justify-center items-center"
          :title="props.autorun ? 'Rerun' : 'Run code'" @click="run"
        >
          <carbon:renew v-if="props.autorun" />
          <carbon:play-filled-alt v-else />
        </IconButton>
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

.output :deep(hr) {
  @apply my-.5 border-none;
}

.output :deep(pre) {
  @apply inline !bg-transparent;
}
</style>
