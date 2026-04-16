import type { SlidevProject } from '../projects'
import { computed, defineService, useActiveTextEditor, useTextEditorSelection, useVscodeContext } from 'reactive-vscode'
import { Position, Range, Uri, window, workspace } from 'vscode'
import { activeData } from '../projects'
import { useDebouncedComputed } from './useDebouncedComputed'
import { useProjectFromDoc } from './useProjectFromDoc'

export const useFocusedSlide = defineService(() => {
  const editor = useActiveTextEditor()
  const selection = useTextEditorSelection(editor)
  const debouncedEditor = useDebouncedComputed(() => editor.value, val => val ? null : 150)
  const projectInfo = useProjectFromDoc(() => debouncedEditor.value?.document)
  const focusedMarkdown = computed(() => projectInfo.value?.md)
  useVscodeContext('slidev:editing-markdown', () => !!focusedMarkdown.value)

  const focusedSourceSlide = useDebouncedComputed(
    () => {
      const md = focusedMarkdown.value
      if (!md || !debouncedEditor.value || !selection.value) {
        return null
      }
      const line = selection.value.active.line + 1
      const slide = md.slides.find(s => line <= s.end)
      return slide || md.slides.at(-1)!
    },
    (newVal, oldVal) => newVal?.filepath === oldVal?.filepath ? 30 : 150,
  )

  const displayedSourceSlide = computed(() => {
    if (!focusedSourceSlide.value)
      return null
    let source = focusedSourceSlide.value
    while (true) {
      const firstChild = source.imports?.[0]
      if (firstChild)
        source = firstChild
      else
        return source
    }
  })
  const focusedSlideNo = computed(() => {
    const slides = projectInfo.value?.project.data.slides
    if (!slides || !displayedSourceSlide.value)
      return null
    return slides.findIndex(s => s.source === displayedSourceSlide.value) + 1
  })

  async function gotoSlide(filepath: string, index: number) {
    if (focusedMarkdown.value?.filepath === filepath && focusedSourceSlide.value?.index === index)
      return
    const slide = activeData.value?.markdownFiles[filepath]?.slides[index]
    if (!slide)
      return
    const document = await workspace.openTextDocument(Uri.file(filepath))
    const cursorPos = new Position(slide.contentStart, 0)
    await window.showTextDocument(document, {
      selection: new Range(cursorPos, cursorPos),
    })
  }

  async function focusSlide(project: SlidevProject, no: number) {
    const source = project.data.slides[no - 1]?.source
    if (!source || displayedSourceSlide.value === source)
      return
    await gotoSlide(source.filepath, source.index)
  }

  return {
    focusedMarkdown,
    focusedSourceSlide,
    focusedSlideNo,
    gotoSlide,
    focusSlide,
  }
})
