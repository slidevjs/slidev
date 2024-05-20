import { onScopeDispose } from '@vue/runtime-core'
import type { Disposable } from 'vscode'

export function useDisposable(disposable: Disposable) {
  onScopeDispose(() => disposable.dispose())
  return disposable
}
