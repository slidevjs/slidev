import type { ComputedRef, MaybeRefOrGetter } from '@vue/runtime-core'
import { computed, toValue, watchEffect } from '@vue/runtime-core'
import { commands } from 'vscode'

export function useVscodeContext<T>(name: string, value: MaybeRefOrGetter<T> | ComputedRef<T>) {
  watchEffect(() => {
    commands.executeCommand('setContext', name, toValue(value))
  })
  return computed(() => toValue(value))
}
