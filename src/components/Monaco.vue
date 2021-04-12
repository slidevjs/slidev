<template>
  <div ref="el" class="monaco-editor text-base" :style="{ height, width }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, watch } from 'vue'
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
  fontSize: {
    default: 20,
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
    default: '600px',
  },
})

const el = ref<HTMLElement>()
const controls = useNavigateControls()
let editor: monaco.editor.IStandaloneCodeEditor

onMounted(() => {
  editor = monaco.editor.create(el.value!, {
    language: props.lang,
    value: props.code,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    folding: false,
    lineDecorationsWidth: 4,
    lineNumbersMinChars: 0,
    theme: isDark.value ? 'vitesse-dark' : 'vitesse-light',
    lineNumbers: props.lineNumbers as any,
    fontSize: props.fontSize,
    glyphMargin: false,
    scrollbar: {
      useShadows: false,
      vertical: 'hidden',
      horizontal: 'hidden',
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    minimap: { enabled: false },
  })
  editor.onDidFocusEditorText(() => controls.paused.value = true)
  editor.onDidBlurEditorText(() => controls.paused.value = false)

  // @ts-expect-error
  editor._themeService._theme.getTokenStyleMetadata = (type, modifiers) => {
    console.log(type, modifiers)
    if (type === 'keyword') {
      return {
        foreground: 5, // color id 5
        bold: true,
        underline: true,
        italic: true,
      }
    }
  }
})

watch(isDark, () => monaco.editor.setTheme(isDark.value ? 'vitesse-dark' : 'vitesse-light'))

onUnmounted(() => {
  editor.dispose()
})
</script>
