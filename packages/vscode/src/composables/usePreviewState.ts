import { computed, createSingletonComposable, onScopeDispose, useVscodeContext, watchEffect } from 'reactive-vscode'
import { window } from 'vscode'
import { configuredPort } from '../configs'
import { generateErrorHtml } from '../html/error'
import { generateReadyHtml } from '../html/ready'
import { activeEntry, activeProject, projects } from '../projects'
import { useDevServer } from './useDevServer'
import { useServerDetector } from './useServerDetector'

export const usePreviewState = createSingletonComposable(() => {
  const detectServer = useServerDetector(configuredPort)
  const activeServer = computed(() => activeProject.value ? useDevServer(activeProject.value) : null)

  const port = computed(() => activeServer.value?.port.value)
  const compatMode = useVscodeContext('slidev:preview:compat', () => !!activeServer.value?.state.compatMode)
  const ready = useVscodeContext('slidev:preview:ready', () => !!activeServer.value?.state.ready)
  const message = computed(() => activeServer.value?.state.message ?? '')
  const html = computed(() => ready.value
    ? generateReadyHtml(port.value!)
    : generateErrorHtml(message.value),
  )

  function refreshState() {
    activeServer.value?.refresh()
    if (!ready.value && activeServer.value?.port.value !== configuredPort.value)
      detectServer.refresh()
  }
  const interval = setInterval(refreshState, 4000)
  onScopeDispose(() => clearInterval(interval))

  watchEffect(() => {
    if (!ready.value && detectServer.state.ready) {
      const detectedEntry = detectServer.state.entry
      if (!detectedEntry)
        return
      if (detectedEntry.toLowerCase() === activeEntry.value?.toLowerCase()) {
        activeProject.value!.port = configuredPort.value
      }
      else if (detectedEntry && projects.has(detectedEntry)) {
        window.showInformationMessage(`Slidev server detected on localhost:${configuredPort.value}.`, 'Start Preview', 'Ignore').then((res) => {
          if (res === 'Start Preview')
            activeEntry.value = detectServer.state.entry
        })
      }
    }
  })

  return {
    port,
    ready,
    compatMode,
    message,
    html,
    refreshState,
  }
})
