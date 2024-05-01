import type { Ref } from '@vue/runtime-core'
import { onScopeDispose, ref, shallowRef, watchEffect } from '@vue/runtime-core'
import { ColorThemeKind, commands, window, workspace } from 'vscode'
import type { ColorTheme } from 'vscode'

const configurations = workspace.getConfiguration('slidev')

// const forceUpdateSignal = ref(1)
// function updateConfigurations(ev: ConfigurationChangeEvent) {
//   if (ev.affectsConfiguration('slidev'))
//     forceUpdateSignal.value++
// }

function useConfiguration<T>(key: string, defaultValue: T): Ref<T> {
  const value = shallowRef<T>(configurations.get<T>(key) ?? defaultValue)
  // watch(forceUpdateSignal, () => setTimeout(() => {
  //   value.value = configurations.get<T>(key) ?? defaultValue
  //   useLogger().info(`FORCEUPDATE CONFIG ${key} to ${configurations.get<T>(key) ?? defaultValue}`)
  // }, 1000))
  // return computed({
  //   get: () => {
  //     return value.value
  //   },
  //   set: (newVal) => {
  //     configurations.update(key, newVal)
  //     value.value = newVal
  //   },
  // })
  watchEffect(() => {
    commands.executeCommand('setContext', `slidev-config.${key}`, value.value)
  })
  return value
}

export const forceEnabled = useConfiguration('enabled', false)
export const configuredPort = useConfiguration('port', 3030)
export const displayAnnotations = useConfiguration('annotations', true)
export const configuredEntry = useConfiguration('entry', '')
export const previewSync = useConfiguration('preview-sync', true)

export const isDarkTheme = ref(true)
updateIsDark(window.activeColorTheme)
function updateIsDark(theme: ColorTheme) {
  isDarkTheme.value = theme.kind === ColorThemeKind.Dark || theme.kind === ColorThemeKind.HighContrast
}

export function useGlobalConfigurations() {
  // const disposable1 = workspace.onDidChangeConfiguration(updateConfigurations)
  const disposable2 = window.onDidChangeActiveColorTheme(updateIsDark)
  onScopeDispose(() => {
    // disposable1.dispose()
    disposable2.dispose()
  })
}
