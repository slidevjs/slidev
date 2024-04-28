import { computed, watch } from '@vue/runtime-core'
import type { DecorationInstanceRenderOptions, DecorationOptions } from 'vscode'
import { Position, Range, window } from 'vscode'
import { useActiveTextEditor } from '../composables/useActiveTextEditor'
import { useDocumentText } from '../composables/useDocumentText'
import { useMarkdownFromDoc } from '../composables/useMarkdownFromDoc'
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
  const docText = useDocumentText(doc)
  const md = useMarkdownFromDoc(doc)
  watch([editor, doc, docText, md], ([editor, doc, docText, md]) => {
    if (!editor || !doc || !docText || !md)
      return

    const dividerRanges: DecorationOptions[] = []
    const frontmatterRanges: DecorationOptions[] = []

    const max = doc.lineCount - 1
    md.slides.forEach((slide, i) => {
      const line = [
        doc.lineAt(Math.max(0, Math.min(max, slide.start))),
        doc.lineAt(Math.max(0, Math.min(max, slide.start - 1))),
        doc.lineAt(Math.max(0, Math.min(max, slide.start + 1))),
      ].find(i => i.text.startsWith('---'))
      if (!line)
        return null

      const start = new Position(line.lineNumber, 0)
      // TODO: This is not the real index!
      const slideIndexText = (i + 1).toString()
      const startDividerRange = new Range(start, new Position(line.lineNumber, line.text.length))
      const slideIndexRenderOptions: DecorationInstanceRenderOptions = {
        after: {
          contentText: ` #${slideIndexText}`,
          fontWeight: 'bold',
          color: '#8888',
        },
      }

      if (slide.frontmatterRaw == null) {
        dividerRanges.push({
          range: startDividerRange,
          renderOptions: slideIndexRenderOptions,
        })

        const frontmatterOptions = {
          range: new Range(start, start),
        }
        frontmatterRanges.push(frontmatterOptions)
      }
      else {
        dividerRanges.push({
          range: startDividerRange,
          renderOptions: slideIndexRenderOptions,
        })

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
    })
    editor.setDecorations(
      dividerDecoration,
      dividerRanges,
    )
    editor.setDecorations(
      frontmatterDecoration,
      frontmatterRanges,
    )
  })
})
