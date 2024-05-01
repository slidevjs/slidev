import { slash } from '@antfu/utils'
import type { MaybeRefOrGetter } from '@vue/runtime-core'
import { computed, toValue } from '@vue/runtime-core'
import type { TextDocument } from 'vscode'
import { activeSlidevData } from '../state'

export function useMarkdownFromDoc(doc: MaybeRefOrGetter<TextDocument | undefined>) {
  return computed(() => {
    const docValue = toValue(doc)
    return docValue ? activeSlidevData.value?.markdownFiles[slash(docValue.uri.fsPath)] ?? null : null
  })
}
