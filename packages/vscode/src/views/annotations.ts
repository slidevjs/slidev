import type { SourceSlideInfo } from '@slidev/types'
import { computed, watch } from '@vue/runtime-core'
import type { DecorationOptions } from 'vscode'
import { Position, Range, window } from 'vscode'
import { useActiveTextEditor } from '../composables/useActiveTextEditor'
import { useMarkdownFromDoc } from '../composables/useMarkdownFromDoc'
import { activeSlidevData } from '../projects'
import { createSingletonComposable } from '../utils/singletonComposable'

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
  const md = useMarkdownFromDoc(doc)
  watch(
    [editor, doc, md, activeSlidevData],
    ([editor, doc, md, data]) => {
      if (!editor || !doc || !md)
        return

      const docText = doc.getText()

      function getTextContent(source: SourceSlideInfo) {
        if (!data)
          return ''
        const slides = data.slides.filter(
          s => s.source === source || s.importChain?.includes(source),
        )
        const content = slides?.length ? slides.map(s => `#${s.index + 1}`).join(', ') : '(hidden)'
        return ` ${content}`
      }

      const dividerRanges: DecorationOptions[] = []
      const frontmatterRanges: DecorationOptions[] = []

      for (const slide of md.slides) {
        if (doc.lineCount <= slide.start)
          continue
        const line = doc.lineAt(slide.frontmatterStyle ? slide.start : slide.start - 1)

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
