import type { MaybeRefOrGetter } from '@vue/runtime-core'
import { computed, toValue } from '@vue/runtime-core'
import type { TextDocument } from 'vscode'
import { activeSlidevData } from '../state'

export function useMarkdownFromDoc(doc: MaybeRefOrGetter<TextDocument | undefined>) {
  return computed(() => {
    const docValue = toValue(doc)
    // TODO: Verify this
    return docValue ? activeSlidevData.value?.markdownFiles[docValue.uri.fsPath] ?? null : null
  })
}
