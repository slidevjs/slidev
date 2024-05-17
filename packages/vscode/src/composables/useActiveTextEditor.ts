import { shallowRef } from '@vue/runtime-core'
import { window } from 'vscode'
import { createSingletonComposable } from '../utils/singletonComposable'
import { useDisposable } from './useDisposable'
import { useProjectFromDoc } from './useProjectFromDoc'
import { useVscodeContext } from './useVscodeContext'

export const useActiveTextEditor = createSingletonComposable(() => {
  const activeTextEditor = shallowRef(window.activeTextEditor)

  useDisposable(window.onDidChangeActiveTextEditor((editor) => {
    activeTextEditor.value = editor
  }))

  const projectInfo = useProjectFromDoc(() => activeTextEditor.value?.document)
  useVscodeContext('slidev:editing-markdown', () => !!projectInfo.value)

  return activeTextEditor
})
