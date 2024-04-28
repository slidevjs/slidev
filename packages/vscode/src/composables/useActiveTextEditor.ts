import { onScopeDispose, shallowRef } from '@vue/runtime-core'
import { window } from 'vscode'
import { createSingletonComposable } from '../utils/singletonComposable'

export const useActiveTextEditor = createSingletonComposable(() => {
  const activeTextEditor = shallowRef(window.activeTextEditor)

  const disposable = window.onDidChangeActiveTextEditor((editor) => {
    activeTextEditor.value = editor
  })
  onScopeDispose(() => disposable.dispose())

  return activeTextEditor
})
