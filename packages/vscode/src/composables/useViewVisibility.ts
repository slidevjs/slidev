import { ref } from '@vue/runtime-core'
import type { TreeView } from 'vscode'
import { useDisposable } from './useDisposable'

export function useViewVisibility(view: TreeView<unknown>) {
  const visible = ref(view.visible)
  useDisposable(view.onDidChangeVisibility(ev => visible.value = ev.visible))
  return visible
}
