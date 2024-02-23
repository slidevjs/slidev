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
  lineNumbers: 'on',
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
  monaco.editor.create(container.value!, {
    model: monaco.editor.createModel(code.value, lang, monaco.Uri.parse(`file:///${nanoid()}.${ext}`)),
    readOnly: props.readonly,
    lineNumbers: props.lineNumbers,
    minimap: { enabled: false },
    padding: { top: 10, bottom: 10 },
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 3,
    tabSize: 2,
    scrollBeyondLastLine: false,
    ...props.editorOptions,
  })
})
</script>

<template>
  <div class="relative h-90" border="2 gray-300 dark:gray-600 rounded-lg">
    <div ref="container" class="absolute inset-.5" />
  </div>
</template>

<style>
div[widgetid="editor.contrib.resizableContentHoverWidget"],
div[widgetid="messageoverlay"] {
  transform: translateY(calc(100% * (var(--slidev-slide-scale) - 1)));
}
</style>
