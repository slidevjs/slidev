import { onScopeDispose, ref, watch } from '@vue/runtime-core'
import { window } from 'vscode'
import { activeSlidevData } from '../state'
import { createSingletonComposable } from '../utils/singletonComposable'
import { useActiveTextEditor } from './useActiveTextEditor'
import { useMarkdownFromDoc } from './useMarkdownFromDoc'

export const useEditingSlideSource = createSingletonComposable(() => {
  const editor = useActiveTextEditor()
  const markdown = useMarkdownFromDoc(() => editor.value?.document)
  const index = ref(0)

  function updateSlideNo() {
    const md = markdown.value
    if (!md || !editor.value) {
      index.value = 0
      return
    }
    const line = editor.value.selection.active.line + 1
    const slide = md.slides.find(s => line <= s.end)
    index.value = slide ? slide.index : md.slides.length - 1
  }

  updateSlideNo()

  const disposable = window.onDidChangeTextEditorSelection(updateSlideNo)
  onScopeDispose(() => disposable.dispose())

  watch([editor, activeSlidevData], updateSlideNo)

  return {
    markdown,
    index,
  }
})
