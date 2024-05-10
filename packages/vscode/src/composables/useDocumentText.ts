import type { MaybeRefOrGetter } from '@vue/runtime-core'
import { shallowRef, toValue, watchEffect } from '@vue/runtime-core'
import type { TextDocument } from 'vscode'
import { workspace } from 'vscode'
import { useDisposable } from './useDisposable'

export function useDocumentText(doc: MaybeRefOrGetter<TextDocument | undefined>) {
  const text = shallowRef(toValue(doc)?.getText())

  watchEffect(() => {
    text.value = toValue(doc)?.getText()
  })

  useDisposable(workspace.onDidChangeTextDocument((ev) => {
    if (ev.document === toValue(doc))
      text.value = ev.document.getText()
  }))

  return text
}
