import type { MaybeRefOrGetter } from '@vue/runtime-core'
import { onScopeDispose, shallowRef, toValue, watchEffect } from '@vue/runtime-core'
import type { TextDocument } from 'vscode'
import { workspace } from 'vscode'

export function useDocumentText(doc: MaybeRefOrGetter<TextDocument | undefined>) {
  const text = shallowRef(toValue(doc)?.getText())

  watchEffect(() => {
    text.value = toValue(doc)?.getText()
  })

  const disposable = workspace.onDidChangeTextDocument((ev) => {
    if (ev.document === toValue(doc))
      text.value = ev.document.getText()
  })
  onScopeDispose(() => disposable.dispose())

  return text
}
