import { createSingletonComposable, ref, useActiveTextEditor, useTextEditorSelection, watchEffect } from 'reactive-vscode'
import { TextEditorSelectionChangeKind } from 'vscode'
import { activeSlidevData } from '../projects'
import { getFirstDisplayedChild } from '../utils/getFirstDisplayedChild'
import { getProjectFromDoc } from './useProjectFromDoc'

export const useFocusedSlideNo = createSingletonComposable(() => {
  const editor = useActiveTextEditor()
  const selection = useTextEditorSelection(editor, [TextEditorSelectionChangeKind.Command, undefined])

  const slideNo = ref(1)

  watchEffect(() => {
    const data = activeSlidevData.value
    const projectInfo = getProjectFromDoc(editor.value?.document)
    if (!data || !projectInfo || !editor.value)
      return
    const line = selection.value.active.line + 1
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
  })

  return slideNo
})
