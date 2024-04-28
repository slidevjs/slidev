import type { WritableComputedRef } from '@vue/runtime-core'
import { computed, onScopeDispose, ref, shallowRef, watch } from '@vue/runtime-core'
import type { ColorTheme, ConfigurationChangeEvent } from 'vscode'
import { ColorThemeKind, window, workspace } from 'vscode'

const configurations = workspace.getConfiguration('slidev')

const forceUpdateSignal = ref(1)
function updateConfigurations(ev: ConfigurationChangeEvent) {
  if (ev.affectsConfiguration('slidev'))
    forceUpdateSignal.value++
}

function useConfiguration<T>(key: string, defaultValue: T): WritableComputedRef<T> {
  const value = shallowRef<T>(configurations.get<T>(key) ?? defaultValue)
  watch(forceUpdateSignal, () => {
    value.value = configurations.get<T>(key) ?? defaultValue
  })
  return computed({
    get: () => {
      return value.value
    },
    set: (newVal) => {
      configurations.update(key, newVal)
      value.value = newVal
    },
  })
}

export const forceEnabled = useConfiguration('enabled', false)
export const configuredPort = useConfiguration('port', 3030)
export const displayAnnotations = useConfiguration('annotations', true)
export const configuredEntry = useConfiguration('entry', '')

export const isDarkTheme = ref(true)
updateIsDark(window.activeColorTheme)
function updateIsDark(theme: ColorTheme) {
  isDarkTheme.value = theme.kind === ColorThemeKind.Dark || theme.kind === ColorThemeKind.HighContrast
}

export function useGlobalConfigurations() {
  const disposable1 = workspace.onDidChangeConfiguration(updateConfigurations)
  const disposable2 = window.onDidChangeActiveColorTheme(updateIsDark)
  onScopeDispose(() => {
    disposable1.dispose()
    disposable2.dispose()
  })
}
