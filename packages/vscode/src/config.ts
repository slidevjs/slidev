import type { Ref, ShallowRef } from '@vue/runtime-core'
import { ref, shallowRef } from '@vue/runtime-core'
import type { ColorTheme, ConfigurationChangeEvent } from 'vscode'
import { ColorThemeKind, window, workspace } from 'vscode'
import { useDisposable } from './composables/useDisposable'

const config = workspace.getConfiguration('slidev')
const configKeys: Record<string, ShallowRef<unknown>> = {}

function useConfiguration<T>(key: string, defaultValue: T): Ref<T> {
  return configKeys[key] = shallowRef<T>(config.get<T>(key) ?? defaultValue)
}

export const configuredPort = useConfiguration('port', 3030)
export const displayAnnotations = useConfiguration('annotations', true)
export const previewSync = useConfiguration('preview-sync', true)

export const isDarkTheme = ref(true)

export function useGlobalConfigurations() {
  function updateConfigurations(ev: ConfigurationChangeEvent) {
    if (!ev.affectsConfiguration('slidev'))
      return
    const newConfig = workspace.getConfiguration('slidev')
    for (const key in configKeys) {
      if (ev.affectsConfiguration(`slidev.${key}`))
        configKeys[key].value = newConfig.get(key)
    }
  }

  useDisposable(workspace.onDidChangeConfiguration(updateConfigurations))

  function updateIsDark(theme: ColorTheme) {
    isDarkTheme.value = theme.kind === ColorThemeKind.Dark || theme.kind === ColorThemeKind.HighContrast
  }
  updateIsDark(window.activeColorTheme)
  useDisposable(window.onDidChangeActiveColorTheme(updateIsDark))
}
