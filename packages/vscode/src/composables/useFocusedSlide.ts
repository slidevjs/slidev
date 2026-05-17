import type { SlidevProject } from '../projects'
import { computed, defineService, useActiveTextEditor, useTextEditorSelection, useTextEditorVisibleRanges, useVscodeContext } from 'reactive-vscode'
import { Position, Range, TextEditorRevealType, Uri, window, workspace } from 'vscode'
import { activeData } from '../projects'
import { getFirstDisplayedChild } from '../utils/getFirstDisplayedChild'
import { useDebouncedComputed } from './useDebouncedComputed'
import { useProjectFromDoc } from './useProjectFromDoc'

interface OverviewAnchor {
  line: number
  no: number
}

export const useFocusedSlide = defineService(() => {
  const editor = useActiveTextEditor()
  const selection = useTextEditorSelection(editor)
  const visibleRanges = useTextEditorVisibleRanges(editor)
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
    return getFirstDisplayedChild(focusedSourceSlide.value)
  })
  const focusedSlideNo = computed(() => {
    const slides = projectInfo.value?.project.data.slides
    if (!slides || !displayedSourceSlide.value)
      return null
    const index = slides.findIndex(s => s.source === displayedSourceSlide.value)
    return index < 0 ? null : index + 1
  })
  const overviewAnchors = computed(() => {
    const info = projectInfo.value
    if (!info)
      return []
    const slides = info.project.data.slides
    return info.md.slides
      .map((source): OverviewAnchor | null => {
        const displayedSource = getFirstDisplayedChild(source)
        const index = slides.findIndex(s => s.source === displayedSource)
        if (index < 0)
          return null
        return {
          line: source.contentStart,
          no: index + 1,
        }
      })
      .filter((anchor): anchor is OverviewAnchor => anchor != null)
      .sort((a, b) => a.no - b.no)
  })
  const viewportSlideNo = computed(() => {
    const range = visibleRanges.value[0]
    if (!range)
      return null
    const start = getFractionalVisibleLine(range.start)
    const end = getFractionalVisibleLine(range.end)
    const visibleLines = Math.max(1, end - start)
    return interpolate(overviewAnchors.value.map(anchor => ({
      x: (anchor.line - start) / visibleLines,
      y: anchor.no,
    })), 0.5)
  })

  function getFractionalVisibleLine(position: Position) {
    const document = editor.value?.document
    const line = position.line
    if (!document || line < 0 || line >= document.lineCount)
      return line
    return line + position.character / (document.lineAt(line).text.length + 2)
  }

  function interpolate(points: { x: number, y: number }[], x: number) {
    if (points.length === 0)
      return null
    if (points.length === 1)
      return points[0].y
    const sorted = [...points].sort((a, b) => a.x - b.x)
    const minY = Math.min(...sorted.map(point => point.y))
    const maxY = Math.max(...sorted.map(point => point.y))

    let previous = sorted[0]
    let next = sorted[1]
    if (x > sorted.at(-1)!.x) {
      previous = sorted.at(-2)!
      next = sorted.at(-1)!
    }
    else {
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].x >= x) {
          previous = sorted[i - 1]
          next = sorted[i]
          break
        }
      }
    }

    const span = next.x - previous.x
    const y = span === 0
      ? previous.y
      : previous.y + (x - previous.x) / span * (next.y - previous.y)
    return Math.min(Math.max(y, minY), maxY)
  }

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

  function revealViewportSlide(no: number) {
    const textEditor = editor.value
    if (!textEditor)
      return
    const line = interpolate(overviewAnchors.value.map(anchor => ({
      x: anchor.no,
      y: anchor.line,
    })), no)
    if (line == null)
      return
    const position = new Position(Math.round(line), 0)
    textEditor.revealRange(new Range(position, position), TextEditorRevealType.InCenter)
  }

  return {
    focusedMarkdown,
    focusedSourceSlide,
    focusedSlideNo,
    viewportSlideNo,
    gotoSlide,
    focusSlide,
    revealViewportSlide,
  }
})
