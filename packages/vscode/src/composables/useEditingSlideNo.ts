import { onScopeDispose, ref, watch } from '@vue/runtime-core'
import { window } from 'vscode'
import { activeSlidevData } from '../state'
import { useActiveTextEditor } from './useActiveTextEditor'

export function useEditingSlideNo() {
  const editor = useActiveTextEditor()

  const slideNo = ref(1)

  function updateSlideNo() {
    const data = activeSlidevData.value
    if (!data || !editor.value)
      return
    const docPath = editor.value.document.uri.fsPath
    const line = editor.value.selection.active.line + 1
    const slide = data.slides.find(s => s.source.filepath === docPath && s.source.start <= line && line <= s.source.end)
    if (slide)
      slideNo.value = slide.index + 1
  }

  updateSlideNo()

  const disposable = window.onDidChangeTextEditorSelection(updateSlideNo)
  onScopeDispose(() => disposable.dispose())

  watch(activeSlidevData, updateSlideNo)

  return slideNo
}
