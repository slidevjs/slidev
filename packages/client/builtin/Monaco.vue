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
import type { RawAtValue } from '@slidev/types'
import type * as monaco from 'monaco-editor'
import { debounce } from '@antfu/utils'
import { whenever } from '@vueuse/core'
import lz from 'lz-string'
import { computed, defineAsyncComponent, nextTick, onMounted, ref } from 'vue'
import { useNav } from '../composables/useNav'
import { useSlideContext } from '../context'
import { makeId } from '../logic/utils'

const props = withDefaults(
  defineProps<{
    codeLz?: string
    diffLz?: string
    lang?: string
    readonly?: boolean
    lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
    height?: number | string // Posible values: 'initial', 'auto', '100%', '200px', etc.
    editorOptions?: monaco.editor.IEditorOptions
    ata?: boolean
    runnable?: boolean
    writable?: string
    autorun?: boolean | 'once'
    showOutputAt?: RawAtValue
    outputHeight?: string
    highlightOutput?: boolean
    runnerOptions?: Record<string, unknown>
  }>(),
  {
    codeLz: '',
    lang: 'typescript',
    readonly: false,
    lineNumbers: 'off',
    height: 'initial',
    ata: true,
    runnable: false,
    autorun: true,
    highlightOutput: true,
  },
)

const CodeRunner = defineAsyncComponent(() => import('../internals/CodeRunner.vue').then(r => r.default))

const code = ref(lz.decompressFromBase64(props.codeLz).trimEnd())
const diff = props.diffLz && ref(lz.decompressFromBase64(props.diffLz).trimEnd())
const isWritable = computed(() => props.writable && !props.readonly && __DEV__)

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

const loadTypes = ref<() => void>()
const { $page: thisSlideNo, $renderContext: renderContext } = useSlideContext()
const { currentSlideNo } = useNav()
const stopWatchTypesLoading = whenever(
  () => Math.abs(thisSlideNo.value - currentSlideNo.value) <= 1 && loadTypes.value,
  (loadTypes) => {
    if (['slide', 'presenter'].includes(renderContext.value))
      loadTypes()
    else
      setTimeout(loadTypes, 5000)
  },
)

onMounted(async () => {
  // Lazy load monaco, so it will be bundled in async chunk
  const { default: setup } = await import('../setup/monaco')
  const { ata, monaco, editorOptions } = await setup()
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
    useInlineViewWhenSpaceIsLimited: false,
    ...editorOptions,
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
  loadTypes.value = () => {
    stopWatchTypesLoading()
    import('#slidev/monaco-types')
    if (props.ata) {
      ata(editableEditor.getValue())
      editableEditor.onDidChangeModelContent(debounce(1000, () => {
        ata(editableEditor.getValue())
      }))
    }
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

  editableEditor.addAction({
    id: 'slidev-save',
    label: 'Save',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: () => {
      if (!isWritable.value || !import.meta.hot?.send) {
        console.warn('[Slidev] this monaco editor is not writable, save action is ignored.')
        return
      }
      import.meta.hot.send('slidev:monaco-write', {
        file: props.writable!,
        content: editableEditor.getValue(),
      })
    },
  })

  nextTick(() => monaco.editor.remeasureFonts())
  setTimeout(() => monaco.editor.remeasureFonts(), 1000)
})
</script>

<template>
  <div class="relative slidev-monaco-container">
    <div ref="outer" class="relative slidev-monaco-container-inner" :style="{ height }">
      <div ref="container" class="absolute inset-0.5" />
    </div>
    <CodeRunner
      v-if="props.runnable"
      v-model="code"
      :lang="lang"
      :autorun="props.autorun"
      :show-output-at="props.showOutputAt"
      :height="props.outputHeight"
      :highlight-output="props.highlightOutput"
      :runner-options="props.runnerOptions"
    />
  </div>
</template>

<style>
div[widgetid='messageoverlay'] {
  transform: translateY(calc(100% * (var(--slidev-slide-scale) - 1)));
}

.slidev-monaco-container {
  position: relative;
  margin: var(--slidev-code-margin);
  line-height: var(--slidev-code-line-height);
  border-radius: var(--slidev-code-radius);
  background: var(--slidev-code-background);
}

.slidev-monaco-container-inner {
  padding: var(--slidev-code-padding);
}

.slidev-monaco-container .monaco-editor {
  --monaco-monospace-font: var(--slidev-code-font-family);
  --vscode-editor-background: var(--slidev-code-background);
  --vscode-editorGutter-background: var(--slidev-code-background);
}

/** Revert styles */
.slidev-monaco-container .monaco-editor a {
  border-bottom: none;
}

.slidev-monaco-container .monaco-editor a:hover {
  border-bottom: none;
}
</style>
