import { computed, onScopeDispose, ref, shallowRef, watch, watchEffect } from '@vue/runtime-core'
import type { WebviewView } from 'vscode'
import { commands, window } from 'vscode'
import { useEditingSlideNo } from '../composables/useEditingSlideNo'
import { isDarkTheme } from '../config'
import { extCtx, previewPort, previewUrl } from '../state'
import { createSingletonComposable } from '../utils/singletonComposable'
import { useLogger } from './logger'

export function usePreviewHtml() {
  const logger = useLogger()

  const state = ref<'pending' | 'ready' | 'error'>('pending')
  const message = ref('')

  const html = computed(() =>
    state.value === 'pending'
      ? generatePendingHtml()
      : state.value === 'ready'
        ? generateReadyHtml()
        : generateErrorHtml(),
  )

  let isWorking = false
  async function refreshState() {
    if (isWorking)
      return
    isWorking = true
    state.value = 'pending'
    message.value = ''
    async function pingUrl(url: string) {
      try {
        if ((await (await fetch(url)).text()).includes('Slidev.js'))
          return true
      }
      catch (err) {
        message.value = String(err)
      }
      return false
    }
    const ok = await pingUrl(`http://[::1]:${previewPort.value}`) || await pingUrl(`http://127.0.0.1:${previewPort.value}`)
    state.value = ok ? 'ready' : 'error'
    logger.info(`Preview state refreshed: ${state.value}. message: ${message.value}`)
    isWorking = false
  }

  watch([previewPort], refreshState)

  watchEffect(() => {
    if (state.value !== 'pending')
      commands.executeCommand('setContext', 'slidev-connected', state.value === 'ready')
  })

  return {
    html,
    refreshState,
  }
}

export const usePreviewWebview = createSingletonComposable(() => {
  const logger = useLogger()
  const { html, refreshState } = usePreviewHtml()

  const view = shallowRef<WebviewView>()

  const disposable = window.registerWebviewViewProvider(
    'slidev-preview',
    {
      resolveWebviewView(webviewView) {
        view.value = webviewView
        view.value.webview.options = {
          enableScripts: true,
          localResourceRoots: [extCtx.value.extensionUri],
        }
        view.value.webview.onDidReceiveMessage(async ({ command }) => {
          if (command === 'config-port')
            commands.executeCommand('slidev.config-port')
        })
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
  watchEffect(syncState)

  watchEffect(() => {
    if (!view.value)
      return

    view.value.webview.html = html.value

    logger.info(`Webview refreshed. Current URL: ${previewUrl.value}`)
  })

  return {
    view,
    refresh: refreshState,
  }
})

function generatePendingHtml() {
  return `
  <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
    />
    <style>
    </style>
  <head>
  <body>
    <div style="text-align: center">
      <p>
        Connecting to <code>${previewUrl.value}</code>
      </p>
    </div>
  </body>`
}

function generateReadyHtml() {
  return `
  <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
    />
    <style>
    :root {
      overflow: hidden;
      --scale: 0.6;
    }
    body {
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: visible;
    }
    iframe {
      border: none;
      width: calc(100% / var(--scale));
      height: calc(100% / var(--scale));
      transform: scale(var(--scale));
      transform-origin: 0 0;
    }
    </style>
  <head>
  <body>
    <iframe id="iframe" sandbox="allow-same-origin allow-scripts" src="${previewUrl.value}"></iframe>
    <script>
      var iframe = document.getElementById('iframe')
      window.addEventListener('message', ({ data }) => {
        if (data && data.target === 'slidev') {
          iframe.contentWindow.postMessage(data, '*')
        }
      })
    </script>
  </body>`
}

function generateErrorHtml() {
  return `
  <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
    />
  <head>
  <script>
    const vscode = acquireVsCodeApi()
    window.configPort = () => {
      vscode.postMessage({
        command: 'config-port'
      })
    }
  </script>
  <style>
  button {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    padding: 8px 12px;
  }
  button:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
  code {
    font-size: 0.9em;
    font-family: var(--vscode-editor-font-family);
    background: var(--vscode-textBlockQuote-border);
    border-radius: 4px;
    padding: 3px 5px;
  }
  </style>
  <body>
    <div style="text-align: center">
      <p>
        Slidev server is not found on <code>${previewUrl.value}</code>
      </p>
      <p>
        please run <code style="color: #679bbb">$ slidev</code> first
      </p>
      <br>
      <button onclick="configPort()"> Config Server Port </button>
    </div>
  </body>
  `
}
