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
import { decode } from 'js-base64'
import * as monaco from 'monaco-editor'
import { nanoid } from 'nanoid'
import { computed, nextTick, onMounted, ref } from 'vue'
import { debounce } from '@antfu/utils'
import setup from '../setup/monaco'

const props = withDefaults(defineProps<{
  code: string
  diff?: string
  lang?: string
  readonly?: boolean
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
  height?: number | string // Posible values: 'initial', 'auto', '100%', '200px', etc.
  editorOptions?: monaco.editor.IEditorOptions
  ata?: boolean
}>(), {
  code: '',
  lang: 'typescript',
  readonly: false,
  lineNumbers: 'off',
  height: 'initial',
  ata: true,
})

const code = decode(props.code).trimEnd()
const diff = props.diff && decode(props.diff).trimEnd()

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
  const { ata } = await setup()
  const model = monaco.editor.createModel(code, lang, monaco.Uri.parse(`file:///${nanoid()}.${ext}`))
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
    const diffModel = monaco.editor.createModel(diff, lang, monaco.Uri.parse(`file:///${nanoid()}.${ext}`))
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

<style>
div[widgetid='messageoverlay'] {
  transform: translateY(calc(100% * (var(--slidev-slide-scale) - 1)));
}

.slidev-monaco-container {
  position: relative;
  margin: var(--slidev-code-margin);
  padding: var(--slidev-code-padding);
  line-height: var(--slidev-code-line-height);
  border-radius: var(--slidev-code-radius);
  background: var(--slidev-code-background);
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
