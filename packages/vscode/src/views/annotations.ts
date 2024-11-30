import type { SourceSlideInfo } from '@slidev/types'
import type { DecorationOptions } from 'vscode'
import { clamp, ensurePrefix } from '@antfu/utils'
import { computed, createSingletonComposable, useActiveTextEditor, watch } from 'reactive-vscode'
import { Position, Range, ThemeColor, window } from 'vscode'
import { useProjectFromDoc } from '../composables/useProjectFromDoc'
import { displayAnnotations } from '../configs'
import { activeProject } from '../projects'
import { toRelativePath } from '../utils/toRelativePath'

const dividerCommonOptions = {
  color: new ThemeColor('panelTitle.inactiveForeground'),
  fontWeight: 'bold',
  isWholeLine: true,
  backgroundColor: '#8881',
}

const firstLineDecoration = window.createTextEditorDecorationType({})
const dividerDecoration = window.createTextEditorDecorationType({
  ...dividerCommonOptions,
  borderStyle: 'solid',
  borderWidth: '1px 0 0 0',
  borderColor: new ThemeColor('panelTitle.activeBorder'),
})
const frontmatterContentDecoration = window.createTextEditorDecorationType({
  isWholeLine: true,
  backgroundColor: '#8881',
})
const frontmatterEndDecoration = window.createTextEditorDecorationType(dividerCommonOptions)
const errorDecoration = window.createTextEditorDecorationType({
  isWholeLine: true,
})

function mergeSlideNumbers(slides: { index: number }[]): string {
  const indexes = slides.map(s => s.index + 1)
  const merged = [[indexes[0], indexes[0]]]
  for (let i = 1; i < indexes.length; i++) {
    if (merged[merged.length - 1][1] + 1 === indexes[i])
      merged[merged.length - 1][1] = indexes[i]
    else
      merged.push([indexes[i], indexes[i]])
  }
  return merged.map(([start, end]) => start === end ? `#${start}` : `#${start}-${end}`).join(', ')
}

export const useAnnotations = createSingletonComposable(() => {
  const editor = useActiveTextEditor()
  const doc = computed(() => editor.value?.document)
  const projectInfo = useProjectFromDoc(doc)
  watch(
    [editor, doc, projectInfo, activeProject, displayAnnotations],
    ([editor, doc, projectInfo, activeProject, enabled]) => {
      if (!editor || !doc || !projectInfo)
        return

      if (!enabled) {
        editor.setDecorations(firstLineDecoration, [])
        editor.setDecorations(dividerDecoration, [])
        editor.setDecorations(frontmatterContentDecoration, [])
        editor.setDecorations(errorDecoration, [])
        return
      }

      const { project, md } = projectInfo
      const isActive = project === activeProject
      const docText = doc.getText()

      function getTextContent(source: SourceSlideInfo) {
        const slides = project.data.slides.filter(
          s => s.source === source || s.importChain?.includes(source),
        )
        const posInfo = slides?.length
          ? mergeSlideNumbers(slides)
          : isActive ? '(hidden)' : ''
        const entryInfo = source.index === 0 && project.data.entry !== md
          ? ` (entry: ${toRelativePath(project.entry)})`
          : ''
        const activeInfo = source.index === 0 && !isActive
          ? ' (inactive)'
          : ''
        return ` ${posInfo}${entryInfo}${activeInfo}`
      }

      const firstLineRanges: DecorationOptions[] = []
      const dividerRanges: DecorationOptions[] = []
      const frontmatterContentRanges: DecorationOptions[] = []
      const frontmatterEndRanges: DecorationOptions[] = []
      for (const slide of md.slides) {
        const lineNo = slide.frontmatterStyle === 'frontmatter' ? slide.start : slide.start - 1
        const line = doc.lineAt(clamp(lineNo, 0, doc.lineCount))

        const start = new Position(line.lineNumber, 0)
        const startDividerRange = new Range(start, new Position(line.lineNumber, line.text.length))

        // If a markdown has no headmatter, we should set `isWholeLine` to `false` for the first line
        const isSpecialCase = slide.index === 0 && !slide.frontmatterStyle
        const ranges = isSpecialCase ? firstLineRanges : dividerRanges
        ranges.push({
          range: startDividerRange,
          renderOptions: {
            after: {
              contentText: getTextContent(slide),
              fontWeight: 'bold',
              color: new ThemeColor('panelTitle.activeBorder'),
            },
          },
        })

        if (slide.frontmatterRaw != null) {
          const range = docText.slice(doc.offsetAt(start))
          const match = range.match(/^---[\s\S]*?\n---/)
          if (match && match.index != null) {
            const endLine = doc.positionAt(doc.offsetAt(start) + match.index + match[0].length).line
            frontmatterContentRanges.push({
              range: new Range(new Position(line.lineNumber + 1, 0), new Position(endLine - 1, 0)),
            })
            if (endLine !== start.line) {
              frontmatterEndRanges.push({
                range: new Range(new Position(endLine, 0), new Position(endLine, 0)),
              })
            }
          }
        }
      }
      editor.setDecorations(firstLineDecoration, firstLineRanges)
      editor.setDecorations(dividerDecoration, dividerRanges)
      editor.setDecorations(frontmatterContentDecoration, frontmatterContentRanges)
      editor.setDecorations(frontmatterEndDecoration, frontmatterEndRanges)

      const errors: DecorationOptions[] = []
      for (const error of md.errors ?? []) {
        errors.push({
          range: new Range(error.row, 0, error.row, 0),
          renderOptions: {
            after: {
              contentText: ensurePrefix(error.message, ' '),
              color: new ThemeColor('editorError.foreground'),
              backgroundColor: new ThemeColor('editorError.background'),
            },
          },
        })
      }
      editor.setDecorations(errorDecoration, errors)
    },
    { immediate: true },
  )
})
