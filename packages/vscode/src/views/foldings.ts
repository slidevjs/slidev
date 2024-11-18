import type { TextDocument } from 'vscode'
import { parse } from '@slidev/parser'
import { createSingletonComposable, useDisposable, useEventEmitter, watch } from 'reactive-vscode'
import { FoldingRangeKind, languages } from 'vscode'
import { getProjectFromDoc } from '../composables/useProjectFromDoc'
import { projects } from '../projects'

export const useFoldings = createSingletonComposable(() => {
  const emitter = useEventEmitter<void>()
  watch(projects, () => emitter.fire(), { deep: true })
  useDisposable(languages.registerFoldingRangeProvider(
    {
      scheme: 'file',
      language: 'markdown',
    },
    {
      onDidChangeFoldingRanges: emitter.event,
      async provideFoldingRanges(document: TextDocument) {
        if (!getProjectFromDoc(document))
          return // Not a slidev markdown file
        // Not using global slides data because it updates too late
        const md = await parse(document.getText(), document.uri.fsPath)
        return md?.slides.map(source => ({
          start: Math.max(0, source.frontmatterStyle === 'frontmatter' ? source.start : source.start - 1),
          end: source.end - 1,
          kind: FoldingRangeKind.Region,
        }))
      },
    },
  ))
})
