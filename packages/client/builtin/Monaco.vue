<!--
Monaco Editor
(auto transformed, you don't need to use this component directly)

Usage:

```ts {monaco}
const your_code = 'here'
```

Learn more: https://sli.dev/guide/syntax.html#monaco-editor
-->

<template>
  <div ref="el" class="vue-monaco text-base" :style="{ height }"></div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, defineProps, watch, computed, getCurrentInstance, onMounted } from 'vue'
import { ignorableWatch } from '@vueuse/core'
import { decode } from 'js-base64'
import type * as monaco from 'monaco-editor'
import { formatCode } from '../setup/prettier'
import { isDark } from '../logic/dark'
import setupMonaco from '../setup/monaco'

const props = defineProps({
  code: {
    default: '',
  },
  lang: {
    default: 'typescript',
  },
  readonly: {
    default: false,
  },
  lineNumbers: {
    default: 'off',
  },
  scale: {
    default: '1',
  },
  height: {
    default: 'auto',
  },
})

const code = ref(decode(props.code))
const height = computed(() => props.height === 'auto' ? `${code.value.split(/\r?\n/g).length * 18 + 20}px` : props.height)

const el = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor

const lang = computed(() => {
  switch (props.lang) {
    case 'ts':
      return 'typescript'
    case 'js':
      return 'javascript'
    default:
      return props.lang
  }
})

const ext = computed(() => {
  switch (lang.value) {
    case 'typescript':
      return 'ts'
    case 'javascript':
      return 'js'
    default:
      return lang.value
  }
})

const vm = getCurrentInstance()!

setupMonaco()
  .then(({ monaco }) => {
    if (!vm.isMounted)
      return new Promise<typeof monaco>(resolve => onMounted(() => resolve(monaco)))
    return monaco
  })
  .then((monaco) => {
    const model = monaco.editor.createModel(
      code.value,
      lang.value,
      monaco.Uri.parse(`file:///root/${Date.now()}.${ext.value}`),
    )

    const style = getComputedStyle(document.documentElement)

    editor = monaco.editor.create(el.value!, {
      model,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      folding: false,
      fontSize: +style.getPropertyValue('--slidev-code-font-size').replace(/px/g, ''),
      fontFamily: style.getPropertyValue('--slidev-code-font-family'),
      lineHeight: +style.getPropertyValue('--slidev-code-line-height').replace(/px/g, ''),
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 0,
      automaticLayout: true,
      readOnly: props.readonly,
      theme: isDark.value ? 'vitesse-dark' : 'vitesse-light',
      lineNumbers: props.lineNumbers as any,
      glyphMargin: false,
      scrollbar: {
        useShadows: false,
        vertical: 'hidden',
        horizontal: 'hidden',
      },
      overviewRulerLanes: 0,
      minimap: { enabled: false },
    })
    async function format() {
      code.value = (await formatCode(code.value, lang.value)).trim()
    }

    const { ignoreUpdates } = ignorableWatch(code, (v) => {
      const selection = editor.getSelection()
      editor.setValue(v)
      if (selection)
        editor.setSelection(selection)
    })

    model.onDidChangeContent(() => {
      const v = editor.getValue().toString()
      if (v !== code.value)
        ignoreUpdates(() => code.value = v)
    })

    // ctrl+s to format
    editor.onKeyDown((e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault()
        format()
      }
    })

    watch(isDark, () => monaco.editor.setTheme(isDark.value ? 'vitesse-dark' : 'vitesse-light'))
  })

onUnmounted(() => editor?.dispose())
</script>

<style lang="postcss">
.vue-monaco {
  background: var(--prism-background);
  padding: var(--slidev-code-padding);
  margin: var(--slidev-code-margin);
  border-radius: var(--slidev-code-radius);
}

.monaco-editor .monaco-hover {
  border-radius: var(--slidev-code-radius);
  @apply overflow-hidden shadow border-none outline-none;
}

.monaco-editor .lines-content,
.monaco-editor .view-line,
.monaco-editor .view-lines {
  @apply select-none;
}
</style>
