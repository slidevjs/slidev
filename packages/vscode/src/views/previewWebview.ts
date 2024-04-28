import { computed, onScopeDispose, shallowRef, watchEffect } from '@vue/runtime-core'
import type { WebviewView } from 'vscode'
import { window } from 'vscode'
import { useEditingSlideNo } from '../composables/useEditingSlideNo'
import { isDarkTheme } from '../config'
import { previewUrl } from '../state'
import { createSingletonComposable } from '../utils/singletonComposable'
import { useLogger } from './logger'

const webviewHtml = computed(() => `
<head>
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
  />
  <style>
  body {
    padding: 0;
    width: 100vw;
    height: 100vh;
  }
  iframe {
    border: none;
    width: 100%;
    height: 100%;
  }
  </style>
<head>
<body>
  <iframe id="iframe" sandbox="" src="${previewUrl.value}"></iframe>
  <script>
    var iframe = document.getElementById('iframe')
    window.addEventListener('message', ({ data }) => {
      if (data && data.target === 'slidev') {
        iframe.contentWindow.postMessage(data, '*')
      }
    })
  </script>
</body>`)

export const usePreviewWebview = createSingletonComposable(() => {
  const logger = useLogger()

  const view = shallowRef<WebviewView>()

  const disposable = window.registerWebviewViewProvider(
    'slidev-preview',
    {
      resolveWebviewView(webviewView) {
        view.value = webviewView
      },
    },
    { webviewOptions: { retainContextWhenHidden: true } },
  )
  onScopeDispose(() => disposable.dispose())

  const editingSlideNo = useEditingSlideNo()

  function syncState() {
    if (!view.value)
      return
    const webview = view.value.webview
    webview.postMessage({
      target: 'slidev',
      type: 'navigate',
      no: editingSlideNo.value,
    })
    webview.postMessage({
      target: 'slidev',
      type: 'css-vars',
      vars: {
        '--slidev-slide-container-background': 'transparent',
      },
    })
    webview.postMessage({
      target: 'slidev',
      type: 'color-schema',
      color: isDarkTheme.value ? 'dark' : 'light',
    })
  }

  function refresh() {
    if (!view.value)
      return

    view.value.webview.html = webviewHtml.value

    logger.info(`Webview refreshed. Current URL: ${previewUrl.value}`)
  }

  watchEffect(syncState)
  watchEffect(refresh)

  return {
    view,
    refresh,
  }
})
