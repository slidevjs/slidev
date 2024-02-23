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
import { onMounted, ref } from 'vue'
import setup from '../setup/monaco'

const props = withDefaults(defineProps<{
  code: string
  diff?: string
  lang?: string
  readonly?: boolean
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
  height?: number | string
  editorOptions?: monaco.editor.IEditorOptions
}>(), {
  code: '',
  lang: 'typescript',
  readonly: false,
  lineNumbers: 'off',
  height: 'auto',
})

const code = ref(decode(props.code).trimEnd())
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

const container = ref<HTMLDivElement>()

onMounted(async () => {
  await setup()
  const model = monaco.editor.createModel(code.value, lang, monaco.Uri.parse(`file:///${nanoid()}.${ext}`))
  monaco.editor.create(container.value!, {
    model,
    readOnly: props.readonly,
    lineNumbers: props.lineNumbers,
    minimap: { enabled: false },
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    padding: { top: 10, bottom: 10 },
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 3,
    bracketPairColorization: { enabled: false },
    tabSize: 2,
    fontSize: 11.5,
    fontFamily: 'var(--slidev-code-font-family)',
    scrollBeyondLastLine: false,
    ...props.editorOptions,
  })
})
</script>

<template>
  <div class="slidev-monaco-container">
    <div ref="container" class="absolute inset-0" />
  </div>
</template>

<style>
div[widgetid="editor.contrib.resizableContentHoverWidget"],
div[widgetid="messageoverlay"] {
  transform: translateY(calc(100% * (var(--slidev-slide-scale) - 1)));
}

.slidev-monaco-container {
  position: relative;
  /* TODO: auto resize */
  height: 100%;
  padding: var(--slidev-code-padding) !important;
  line-height: var(--slidev-code-line-height) !important;
  border-radius: var(--slidev-code-radius) !important;
  background: var(--slidev-code-background);
  overflow: auto;
}

.slidev-monaco-container .monaco-editor {
  --monaco-monospace-font: var(--slidev-code-font-family);
  --vscode-editor-background: var(--slidev-code-background);
  --vscode-editorGutter-background: var(--slidev-code-background);
}
</style>
