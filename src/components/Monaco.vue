<template>
  <div ref="el" class="vue-monaco text-base" :style="{ height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, watch, computed } from 'vue'
import { ignorableWatch } from '@vueuse/core'
import { decode } from 'js-base64'
import { formatCode } from '../logic/prettier'
import { monaco } from './MonacoEnv'
import { isDark, useNavigateControls } from '~/logic'

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
const height = computed(() => props.height === 'auto' ? `${code.value.split('\n').length * 18 + 16}px` : props.height)

const el = ref<HTMLElement>()
const controls = useNavigateControls()
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

onMounted(() => {
  const model = monaco.editor.createModel(
    code.value,
    lang.value,
    monaco.Uri.parse(`file:///root/${Date.now()}.${ext.value}`),
  )

  editor = monaco.editor.create(el.value!, {
    model,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    folding: false,
    fontSize: 12,
    fontFamily: '\'Fira Code\', monospace',
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
  editor.onDidFocusEditorText(() => controls.paused.value = true)
  editor.onDidBlurEditorText(() => controls.paused.value = false)

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
})

watch(isDark, () => monaco.editor.setTheme(isDark.value ? 'vitesse-dark' : 'vitesse-light'))

onUnmounted(() => editor.dispose())
</script>
<style lang="postcss">
.vue-monaco {
  background: var(--prism-background);
  padding: var(--prism-block-padding-y) var(--prism-block-padding-x);
  margin: var(--prism-block-margin-y) var(--prism-block-margin-x);
  @apply rounded p-2;
}

.monaco-editor .monaco-hover {
  @apply rounded overflow-hidden shadow border-none outline-none;
}

.monaco-editor .lines-content,
.monaco-editor .view-line,
.monaco-editor .view-lines {
  @apply select-none;
}
</style>
