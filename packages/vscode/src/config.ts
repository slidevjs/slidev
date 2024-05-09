import type { Ref, ShallowRef } from '@vue/runtime-core'
import { onScopeDispose, ref, shallowRef } from '@vue/runtime-core'
import type { ColorTheme, ConfigurationChangeEvent } from 'vscode'
import { ColorThemeKind, window, workspace } from 'vscode'

const config = workspace.getConfiguration('slidev')
const configKeys: Record<string, ShallowRef<unknown>> = {}

function useConfiguration<T>(key: string, defaultValue: T): Ref<T> {
  return configKeys[key] = shallowRef<T>(config.get<T>(key) ?? defaultValue)
}

export const forceEnabled = useConfiguration('enabled', false)
export const configuredPort = useConfiguration('port', 3030)
export const displayAnnotations = useConfiguration('annotations', true)
export const configuredEntry = useConfiguration('entry', '')
export const previewSync = useConfiguration('preview-sync', true)

export const isDarkTheme = ref(true)

export function useGlobalConfigurations() {
  function updateConfigurations(ev: ConfigurationChangeEvent) {
    if (!ev.affectsConfiguration('slidev'))
      return
    for (const key in configKeys) {
      if (ev.affectsConfiguration(`slidev.${key}`))
        configKeys[key].value = config.get(key)
    }
  }

  const disposable1 = workspace.onDidChangeConfiguration(updateConfigurations)

  function updateIsDark(theme: ColorTheme) {
    isDarkTheme.value = theme.kind === ColorThemeKind.Dark || theme.kind === ColorThemeKind.HighContrast
  }
  updateIsDark(window.activeColorTheme)
  const disposable2 = window.onDidChangeActiveColorTheme(updateIsDark)

  onScopeDispose(() => {
    disposable1.dispose()
    disposable2.dispose()
  })
}
