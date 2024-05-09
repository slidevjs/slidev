import { onScopeDispose, reactive, ref, shallowRef, watch, watchEffect } from '@vue/runtime-core'
import type { WebviewView } from 'vscode'
import { Uri, commands, env, window } from 'vscode'
import { useFocusedSlideNo } from '../composables/useFocusedSlideNo'
import { usePreviewState } from '../composables/usePreviewState'
import { isDarkTheme, previewSync } from '../config'
import { extCtx } from '../index'
import { activeSlidevData } from '../projects'
import { createSingletonComposable } from '../utils/singletonComposable'
import { useVscodeContext } from '../composables/useVscodeContext'
import { useLogger } from './logger'

export const usePreviewWebview = createSingletonComposable(() => {
  const logger = useLogger()
  const { port, ready, html, compatMode, refreshState } = usePreviewState()
  const focusedSlideNo = useFocusedSlideNo()

  useVscodeContext('slidev:preview:sync', previewSync)

  const view = shallowRef<WebviewView>()
  const previewNavState = reactive({
    no: 0,
    clicks: 0,
    hasNext: true,
    hasPrev: false,
  })
  const initializedClientId = ref('')

  const disposable = window.registerWebviewViewProvider(
    'slidev-preview',
    {
      resolveWebviewView(webviewView) {
        view.value = webviewView
        view.value.webview.options = {
          enableScripts: true,
          localResourceRoots: [extCtx.value.extensionUri],
        }
        view.value.webview.onDidReceiveMessage(async (data) => {
          if (data.type === 'command') {
            commands.executeCommand(`slidev.${data.command}`)
          }
          else if (data.type === 'update-state') {
            if (initializedClientId.value === data.clientId) {
              Object.assign(previewNavState, data.navState)
            }
            else {
              initializedClientId.value = data.clientId
              setTimeout(() => {
                if (previewSync.value && initializedClientId.value === data.clientId)
                  postMessage('navigate', { no: focusedSlideNo.value })
              }, 300)
            }
          }
        })
      },
    },
    { webviewOptions: { retainContextWhenHidden: true } },
  )
  onScopeDispose(() => disposable.dispose())

  const pageId = ref(0)
  let i = 0
  function refresh() {
    refreshState()
    if (!view.value)
      return
    view.value.webview.html = `${html.value}<!--${i++}-->`
    logger.info(`Webview refreshed. Current URL: http://localhost:${port.value}`)
    setTimeout(() => pageId.value++, 300)
  }
  watchEffect(refresh)

  function postMessage(type: string, data: Record<string, unknown>) {
    view.value?.webview.postMessage({
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
      postMessage('navigate', { no, clicks: 999999 })
    }
  })
  watch([pageId], () => postMessage('css-vars', { '--slidev-slide-container-background': 'transparent' }))
  watch([pageId, isDarkTheme], ([_, dark]) => postMessage('color-schema', { color: dark ? 'dark' : 'light' }))

  watchEffect(() => {
    if (view.value) {
      const slideNo = ready.value && previewNavState.no > 0 ? ` (${previewNavState.no}/${activeSlidevData.value?.slides.length})` : ''
      const compatInfo = compatMode.value ? ' (compat mode)' : ''
      view.value.title = `Preview${slideNo}${compatInfo}`
    }
  })

  function useNavOperation(operation: string, ...args: unknown[]) {
    return () => {
      if (compatMode.value) {
        window.showErrorMessage('Unsupported oprtation', {
          detail: 'The current version of Slidev CLI does not support this operation. Please update the Slidev CLI.',
        })
      }
      postMessage('navigate', { operation, args })
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
