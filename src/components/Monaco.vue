<template>
  <div ref="el" class="vue-monaco text-base" :style="{ height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, watch, computed, defineEmit } from 'vue'
import { useVModel } from '@vueuse/core'
import { formatCode } from '../logic/prettier'
import { monaco } from './MonacoEnv'
import { isDark, useNavigateControls } from '~/logic'

const emit = defineEmit()
const props = defineProps({
  code: {
    default:
`
import { ref, computed } from 'vue'

const counter = ref(0)
const doubled = computed(() => counter.value * 2)
`.trim(),
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

const code = useVModel(props, 'code', emit, { passive: true })
const height = computed(() => props.height === 'auto' ? `${code.value.split('\n').length * 1.5}em` : props.height)

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

onMounted(() => {
  editor = monaco.editor.create(el.value!, {
    language: lang.value,
    value: props.code,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    folding: false,
    fontSize: 14,
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

  watch(code, (v) => {
    const selection = editor.getSelection()
    editor.setValue(v)
    if (selection)
      editor.setSelection(selection)
  })

  editor.getModel()?.onDidChangeContent((e) => {
    const v = editor.getValue()
    if (v !== code.value)
      code.value = v
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
<style>
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
