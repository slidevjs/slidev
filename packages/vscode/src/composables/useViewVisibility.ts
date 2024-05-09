import { onScopeDispose, ref } from '@vue/runtime-core'
import type { TreeView } from 'vscode'

export function useViewVisibility(view: TreeView<unknown>) {
  const visible = ref(view.visible)
  const disposable = view.onDidChangeVisibility(ev => visible.value = ev.visible)
  onScopeDispose(() => disposable.dispose())
  return visible
}
