import { createSingletonComposable, extensionContext, reactive, ref, useIsDarkTheme, useVscodeContext, useWebviewView, watch, watchEffect } from 'reactive-vscode'
import { commands, env, Uri, window } from 'vscode'
import { useFocusedSlideNo } from '../composables/useFocusedSlideNo'
import { usePreviewState } from '../composables/usePreviewState'
import { previewSync } from '../configs'
import { activeSlidevData } from '../projects'
import { logger } from './logger'

export const usePreviewWebview = createSingletonComposable(() => {
  const { port, ready, html, compatMode, refreshState } = usePreviewState()
  const focusedSlideNo = useFocusedSlideNo()
  const isDarkTheme = useIsDarkTheme()

  useVscodeContext('slidev:preview:sync', previewSync)

  const previewNavState = reactive({
    no: 0,
    clicks: 0,
    hasNext: true,
    hasPrev: false,
  })
  const initializedClientId = ref('')

  const { view, postMessage, forceRefresh } = useWebviewView(
    'slidev-preview',
    html,
    {
      retainContextWhenHidden: true,
      webviewOptions: {
        enableScripts: true,
        localResourceRoots: [extensionContext.value!.extensionUri],
      },
      async onDidReceiveMessage(data) {
        if (data.type === 'command') {
          commands.executeCommand(`slidev.${data.command}`)
        }
        else if (data.type === 'update-state') {
          if (initializedClientId.value === data.clientId) {
            Object.assign(previewNavState, data.navState)
          }
          else {
            initializedClientId.value = data.clientId
            if (previewSync.value && initializedClientId.value === data.clientId)
              postSlidevMessage('navigate', { no: focusedSlideNo.value })
          }
        }
      },
    },
  )

  const pageId = ref(0)
  function refresh() {
    refreshState()
    if (!view.value)
      return
    forceRefresh()
    logger.info(`Webview refreshed. Current URL: http://localhost:${port.value}`)
    setTimeout(() => pageId.value++, 300)
  }
  watch([view, port], refresh)

  function postSlidevMessage(type: string, data: Record<string, unknown>) {
    postMessage({
      target: 'slidev',
      sender: 'vscode',
      type,
      ...data,
    })
  }

  watch([pageId, previewSync, focusedSlideNo], ([_, sync, no]) => {
    if (sync) {
      if (compatMode.value)
        previewNavState.no = no
      postSlidevMessage('navigate', { no, clicks: 999999 })
    }
  })
  watch([pageId], () => postSlidevMessage('css-vars', { '--slidev-slide-container-background': 'transparent' }))
  watch([pageId, isDarkTheme], ([_, dark]) => postSlidevMessage('color-schema', { color: dark ? 'dark' : 'light' }))

  watchEffect(() => {
    if (view.value) {
      const slideNo = ready.value && previewNavState.no > 0 ? ` (${previewNavState.no}/${activeSlidevData.value?.slides.length})` : ''
      const compatInfo = compatMode.value ? ' (compat mode)' : ''
      view.value.title = `Preview${slideNo}${compatInfo}`
    }
  })

  function useNavOperation(operation: string, ...args: unknown[]) {
    return () => {
      if (compatMode.value)
        window.showErrorMessage('Unsupported operation: Slidev server too old.')
      postSlidevMessage('navigate', { operation, args })
    }
  }

  return {
    view,
    refresh,
    retry: () => !ready.value && refresh(),
    previewNavState,
    nextClick: useNavOperation('next'),
    prevClick: useNavOperation('prev'),
    nextSlide: useNavOperation('nextSlide', true),
    prevSlide: useNavOperation('prevSlide', true),
    openExternal: () => {
      const query = previewNavState.clicks > 0 ? `?clicks=${previewNavState.clicks}` : ''
      const url = `http://localhost:${port.value}/${previewNavState.no}${query}`
      return env.openExternal(Uri.parse(url))
    },
  }
})
