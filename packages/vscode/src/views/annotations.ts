import { clamp } from '@antfu/utils'
import type { SourceSlideInfo } from '@slidev/types'
import { computed, watch } from '@vue/runtime-core'
import type { DecorationOptions } from 'vscode'
import { Position, Range, window } from 'vscode'
import { useActiveTextEditor } from '../composables/useActiveTextEditor'
import { useProjectFromDoc } from '../composables/useProjectFromDoc'
import { activeProject } from '../projects'
import { createSingletonComposable } from '../utils/singletonComposable'
import { toRelativePath } from '../utils/toRelativePath'

const dividerDecoration = window.createTextEditorDecorationType({
  color: '#8884',
  isWholeLine: true,
})
const frontmatterDecoration = window.createTextEditorDecorationType({
  isWholeLine: true,
  backgroundColor: '#8881',
  borderColor: '#8882',
  border: '1px',
})

export const useAnnotations = createSingletonComposable(() => {
  const editor = useActiveTextEditor()
  const doc = computed(() => editor.value?.document)
  const projectInfo = useProjectFromDoc(doc)
  watch(
    [editor, doc, projectInfo, activeProject],
    ([editor, doc, projectInfo, activeProject]) => {
      if (!editor || !doc || !projectInfo)
        return

      const { project, md } = projectInfo
      const isActive = project === activeProject
      const docText = doc.getText()

      function getTextContent(source: SourceSlideInfo) {
        const slides = project.data.slides.filter(
          s => s.source === source || s.importChain?.includes(source),
        )
        const posInfo = slides?.length
          ? slides.map(s => `#${s.index + 1}`).join(', ')
          : isActive ? '(hidden)' : ''
        const entryInfo = source.index === 0 && project.data.entry !== md
          ? ` (entry: ${toRelativePath(project.entry)})`
          : ''
        const activeInfo = source.index === 0 && !isActive
          ? ' (inactive)'
          : ''
        return ` ${posInfo}${entryInfo}${activeInfo}`
      }

      const dividerRanges: DecorationOptions[] = []
      const frontmatterRanges: DecorationOptions[] = []

      for (const slide of md.slides) {
        const lineNo = slide.frontmatterStyle ? slide.start : slide.start - 1
        const line = doc.lineAt(clamp(lineNo, 0, doc.lineCount))

        const start = new Position(line.lineNumber, 0)
        const startDividerRange = new Range(start, new Position(line.lineNumber, line.text.length))
        dividerRanges.push({
          range: startDividerRange,
          renderOptions: {
            after: {
              contentText: getTextContent(slide),
              fontWeight: 'bold',
              color: '#8888',
            },
          },
        })

        if (slide.frontmatterRaw != null) {
          const range = docText.slice(doc.offsetAt(start))
          const match = range.match(/^---[\s\S]*?\n---/)
          if (match && match.index != null) {
            const endLine = doc.positionAt(doc.offsetAt(start) + match.index + match[0].length).line
            const decoOptions = {
              range: new Range(start, new Position(endLine, 0)),
            }
            frontmatterRanges.push(decoOptions)
            if (endLine !== start.line) {
              const endDividerOptions = {
                range: new Range(new Position(endLine, 0), new Position(endLine, 0)),
              }
              dividerRanges.push(endDividerOptions)
            }
          }
        }
      }

      editor.setDecorations(
        dividerDecoration,
        dividerRanges,
      )
      editor.setDecorations(
        frontmatterDecoration,
        frontmatterRanges,
      )
    },
    { immediate: true },
  )
})
