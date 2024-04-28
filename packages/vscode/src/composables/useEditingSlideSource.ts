import { onScopeDispose, ref, watch } from '@vue/runtime-core'
import { window } from 'vscode'
import { activeSlidevData } from '../state'
import { useActiveTextEditor } from './useActiveTextEditor'
import { useMarkdownFromDoc } from './useMarkdownFromDoc'

export function useEditingSlideSource() {
  const editor = useActiveTextEditor()
  const markdown = useMarkdownFromDoc(() => editor.value?.document)
  const index = ref(0)

  function updateSlideNo() {
    const md = markdown.value
    if (!md || !editor.value)
      return
    const line = editor.value.selection.active.line + 1
    const slide = md.slides.find(s => s.start <= line && line <= s.end)
    if (slide)
      index.value = slide.index
  }

  updateSlideNo()

  const disposable = window.onDidChangeTextEditorSelection(updateSlideNo)
  onScopeDispose(() => disposable.dispose())

  watch(activeSlidevData, updateSlideNo)

  return {
    markdown,
    index,
  }
}
