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
}>(), {
  codeLz: '',
  lang: 'typescript',
  readonly: false,
  lineNumbers: 'off',
  height: 'initial',
  ata: true,
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
</script>

<template>
  <div ref="outer" class="slidev-monaco-container" :style="{ height }">
    <div ref="container" class="absolute inset-0.5" />
  </div>
</template>
