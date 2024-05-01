import { onScopeDispose, ref, watch } from '@vue/runtime-core'
import { window } from 'vscode'
import { activeSlidevData } from '../state'
import { useActiveTextEditor } from './useActiveTextEditor'
import { useMarkdownFromDoc } from './useMarkdownFromDoc'

export function useEditingSlideNo() {
  const editor = useActiveTextEditor()

  const slideNo = ref(1)

  function updateSlideNo() {
    const data = activeSlidevData.value
    const md = useMarkdownFromDoc(editor.value?.document).value
    if (!data || !md || !editor.value)
      return
    const line = editor.value.selection.active.line + 1
    const slide = md.slides.find(s => s.start <= line && line <= s.end)
    if (slide) {
      let source = slide
      while (true) {
        const firstChild = source.imports?.[0]
        if (firstChild)
          source = firstChild
        else
          break
      }
      const no = data.slides.findIndex(s => s.source === source) + 1
      if (no)
        slideNo.value = no
    }
  }

  updateSlideNo()

  const disposable = window.onDidChangeTextEditorSelection(updateSlideNo)
  onScopeDispose(() => disposable.dispose())

  watch(activeSlidevData, updateSlideNo)

  return slideNo
}
