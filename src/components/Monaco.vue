<template>
  <div ref="el" class="editor text-base" :style="{ height, width }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, watch } from 'vue'
import { formatCode } from '../logic/prettier'
import { monaco } from './MonacoEnv'
import { isDark, useNavigateControls } from '~/logic'

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
  lineNumbers: {
    default: 'off',
  },
  width: {
    default: '800px',
  },
  height: {
    default: '300px',
  },
  scale: {
    default: '1',
  },
})

const el = ref<HTMLElement>()
const controls = useNavigateControls()
let editor: monaco.editor.IStandaloneCodeEditor

onMounted(() => {
  editor = monaco.editor.create(el.value!, {
    language: props.lang,
    value: `${props.code}\n\n`,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    folding: false,
    fontFamily: '\'Fira Code\', monospace',
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 0,
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
    const selection = editor.getSelection()
    editor.setValue(`${await formatCode(editor.getValue(), props.lang)}\n\n`)
    if (selection)
      editor.setSelection(selection)
  }

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
.monaco-editor .monaco-hover {
  @apply rounded overflow-hidden shadow border-none outline-none;
}

.monaco-editor .lines-content,
.monaco-editor .view-line,
.monaco-editor .view-lines {
  @apply select-none;
}
</style>
