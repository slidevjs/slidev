import { parse } from '@slidev/parser'
import { onScopeDispose } from '@vue/runtime-core'
import type { TextDocument } from 'vscode'
import { FoldingRangeKind, languages } from 'vscode'
import { createSingletonComposable } from '../utils/singletonComposable'
import { getProjectFromDoc } from '../composables/useProjectFromDoc'

export const useFoldings = createSingletonComposable(() => {
  const disposable = languages.registerFoldingRangeProvider(
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
        return md?.slides.map(slide => ({
          start: slide.frontmatterStyle ? slide.start : slide.start - 1,
          end: slide.end - 1,
          kind: FoldingRangeKind.Region,
        }))
      },
    },
  )
  onScopeDispose(() => disposable.dispose())
})
