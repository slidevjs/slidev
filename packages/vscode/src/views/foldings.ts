import { onScopeDispose, watch } from '@vue/runtime-core'
import type { TextDocument } from 'vscode'
import { EventEmitter, FoldingRange, FoldingRangeKind, languages } from 'vscode'
import { useMarkdownFromDoc } from '../composables/useMarkdownFromDoc'
import { activeSlidevData } from '../projects'
import { createSingletonComposable } from '../utils/singletonComposable'

export const useFoldings = createSingletonComposable(() => {
  const onChange = new EventEmitter<void>()

  const disposable = languages.registerFoldingRangeProvider(
    {
      scheme: 'file',
      language: 'markdown',
    },
    {
      onDidChangeFoldingRanges: onChange.event,
      provideFoldingRanges(document: TextDocument): FoldingRange[] {
        const md = useMarkdownFromDoc(document).value
        return md?.slides.map(i => new FoldingRange(i.start - 1, i.end - 1, FoldingRangeKind.Region)) ?? []
      },
    },
  )
  onScopeDispose(() => disposable.dispose())

  watch(activeSlidevData, () => onChange.fire())
})
