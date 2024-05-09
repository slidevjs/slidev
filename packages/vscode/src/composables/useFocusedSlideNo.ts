import { onScopeDispose, ref, watch } from '@vue/runtime-core'
import { TextEditorSelectionChangeKind, window } from 'vscode'
import { activeSlidevData } from '../projects'
import { getFirstDisplayedChild } from '../utils/getFirstDisplayedChild'
import { createSingletonComposable } from '../utils/singletonComposable'
import { useActiveTextEditor } from './useActiveTextEditor'
import { getProjectFromDoc } from './useProjectFromDoc'

export const useFocusedSlideNo = createSingletonComposable(() => {
  const editor = useActiveTextEditor()

  const slideNo = ref(1)

  function updateSlideNo() {
    const data = activeSlidevData.value
    const projectInfo = getProjectFromDoc(editor.value?.document)
    if (!data || !projectInfo || !editor.value)
      return
    const line = editor.value.selection.active.line + 1
    const slide = projectInfo.md.slides.find(s => s.start <= line && line <= s.end)
    if (slide) {
      const source = getFirstDisplayedChild(slide)
      const focusedSlide = data.slides[slideNo.value - 1]
      if (focusedSlide.source === source)
        return // Same slide
      const no = data.slides.findIndex(s => s.source === source) + 1
      if (no)
        slideNo.value = no
    }
  }

  updateSlideNo()

  const disposable = window.onDidChangeTextEditorSelection(({ kind }) => {
    if (kind !== TextEditorSelectionChangeKind.Command)
      updateSlideNo()
  })
  onScopeDispose(() => disposable.dispose())

  watch(activeSlidevData, updateSlideNo)

  return slideNo
})
