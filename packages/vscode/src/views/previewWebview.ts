import { computed, onScopeDispose, reactive, ref, shallowRef, watch, watchEffect } from '@vue/runtime-core'
import type { WebviewView } from 'vscode'
import { commands, window } from 'vscode'
import { useFocusedSlideNo } from '../composables/useFocusedSlideNo'
import { isDarkTheme, previewSync } from '../config'
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
    // Not sure why we can't use `localhost:` here
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
  const previewNavState = reactive({
    no: 0,
    clicks: 0,
    hasNext: true,
    hasPrev: false,
  })

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
          if (data.command === 'config-port')
            commands.executeCommand('slidev.config-port')
          else if (data.command === 'update-state')
            Object.assign(previewNavState, data.navState)
        })
      },
    },
    { webviewOptions: { retainContextWhenHidden: true } },
  )
  onScopeDispose(() => disposable.dispose())

  const focusedSlideNo = useFocusedSlideNo()

  function postMessage(type: string, data: Record<string, unknown>) {
    view.value?.webview.postMessage({
      target: 'slidev',
      sender: 'vscode',
      type,
      ...data,
    })
  }

  const pageId = ref(0)
  watchEffect(() => {
    if (!view.value)
      return
    view.value.webview.html = html.value
    logger.info(`Webview refreshed. Current URL: ${previewUrl.value}`)
    setTimeout(() => pageId.value++, 300)
  })

  watch([pageId, previewSync, focusedSlideNo], ([_, sync, no]) => sync && postMessage('navigate', { no }))
  watch([pageId], () => postMessage('css-vars', { '--slidev-slide-container-background': 'transparent' }))
  watch([pageId, isDarkTheme], ([_, dark]) => postMessage('color-schema', { color: dark ? 'dark' : 'light' }))

  function useNavOperation(operation: string) {
    return () => postMessage('navigate', { operation })
  }

  return {
    view,
    refresh: refreshState,
    previewNavState,
    nextClick: useNavOperation('next'),
    prevClick: useNavOperation('prev'),
    nextSlide: useNavOperation('nextSlide'),
    prevSlide: useNavOperation('prevSlide'),
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
          if (data.sender === 'vscode')
            iframe.contentWindow.postMessage(data, '*')
          else
            vscode.postMessage({
              command: 'update-state',
              ...data,
            })
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
