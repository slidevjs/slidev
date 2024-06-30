import { computed, createSingletonComposable, ref, useActiveTextEditor, useTextEditorSelection, watchEffect } from 'reactive-vscode'
import { useProjectFromDoc } from './useProjectFromDoc'

export const useEditingSlideSource = createSingletonComposable(() => {
  const editor = useActiveTextEditor()
  const projectInfo = useProjectFromDoc(() => editor.value?.document)
  const markdown = computed(() => projectInfo.value?.md)
  const selection = useTextEditorSelection(editor)

  const index = ref(0)

  watchEffect(() => {
    const md = markdown.value
    if (!md || !editor.value) {
      index.value = 0
      return
    }
    const line = selection.value.active.line + 1
    const slide = md.slides.find(s => line <= s.end)
    index.value = slide ? slide.index : md.slides.length - 1
  })

  return {
    markdown,
    index,
  }
})
