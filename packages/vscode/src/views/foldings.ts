import { parse } from '@slidev/parser'
import type { TextDocument } from 'vscode'
import { FoldingRangeKind, languages } from 'vscode'
import { useDisposable } from '../composables/useDisposable'
import { getProjectFromDoc } from '../composables/useProjectFromDoc'
import { createSingletonComposable } from '../utils/singletonComposable'

export const useFoldings = createSingletonComposable(() => {
  useDisposable(languages.registerFoldingRangeProvider(
    {
      scheme: 'file',
      language: 'markdown',
    },
    {
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
