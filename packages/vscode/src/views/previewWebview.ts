import { computed, onScopeDispose, reactive, ref, shallowRef, watch, watchEffect } from '@vue/runtime-core'
import type { WebviewView } from 'vscode'
import { commands, window } from 'vscode'
import { useFocusedSlideNo } from '../composables/useFocusedSlideNo'
import { isDarkTheme, previewSync } from '../config'
import { extCtx, previewOrigin, previewPort, previewUrl } from '../state'
import { createSingletonComposable } from '../utils/singletonComposable'
import { activeSlidevData } from '../projects'
import { useLogger } from './logger'

const usePreviewHtml = createSingletonComposable(() => {
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
  async function refreshState(setPending: boolean) {
    setPending && (state.value = 'pending')
    if (isWorking)
      return
    isWorking = true
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

  refreshState(true)
  watch([previewPort], () => refreshState(true))

  const interval = setInterval(() => refreshState(false), 4000)
  onScopeDispose(() => clearInterval(interval))

  watchEffect(() => {
    if (state.value !== 'pending')
      commands.executeCommand('setContext', 'slidev-connected', state.value === 'ready')
  })

  return {
    html,
    state,
    refreshState,
  }
})

export const usePreviewWebview = createSingletonComposable(() => {
  const logger = useLogger()
  const { html, state, refreshState } = usePreviewHtml()
  const focusedSlideNo = useFocusedSlideNo()

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
          if (data.command === 'start-dev') {
            commands.executeCommand('slidev.start-dev')
          }
          else if (data.command === 'config-port') {
            commands.executeCommand('slidev.config-port')
          }
          else if (data.command === 'update-state') {
            Object.assign(previewNavState, data.navState)
            if (initializedClientId.value !== data.clientId) {
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

  function postMessage(type: string, data: Record<string, unknown>) {
    view.value?.webview.postMessage({
      target: 'slidev',
      sender: 'vscode',
      type,
      ...data,
    })
  }

  const pageId = ref(0)
  watch([view, html, previewUrl], () => {
    if (!view.value)
      return
    view.value.webview.html = html.value
    logger.info(`Webview refreshed. Current URL: ${previewUrl.value}`)
    setTimeout(() => pageId.value++, 300)
  })

  watch([pageId, previewSync, focusedSlideNo], ([_, sync, no]) => sync && postMessage('navigate', { no, clicks: 999999 }))
  watch([pageId], () => postMessage('css-vars', { '--slidev-slide-container-background': 'transparent' }))
  watch([pageId, isDarkTheme], ([_, dark]) => postMessage('color-schema', { color: dark ? 'dark' : 'light' }))

  watchEffect(() => {
    if (view.value) {
      if (state.value === 'ready' && previewNavState.no > 0)
        view.value.title = `Preview (${previewNavState.no}/${activeSlidevData.value?.slides.length})`
      else
        view.value.title = 'Preview'
    }
  })

  function useNavOperation(operation: string, ...args: unknown[]) {
    return () => postMessage('navigate', { operation, args })
  }

  return {
    view,
    state,
    refresh: () => refreshState(true),
    retry: () => state.value === 'error' && refreshState(false),
    previewNavState,
    nextClick: useNavOperation('next'),
    prevClick: useNavOperation('prev'),
    nextSlide: useNavOperation('nextSlide', true),
    prevSlide: useNavOperation('prevSlide', true),
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
      const vscode = acquireVsCodeApi()
      const iframe = document.getElementById('iframe')
      window.addEventListener('message', ({ data }) => {
        if (data && data.target === 'slidev') {
          if (data.sender === 'vscode')
            iframe.contentWindow.postMessage(data, '*')
          else
            vscode.postMessage({
              ...data,
              command: 'update-state',
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
    window.sendCommand = (command) => void vscode.postMessage({ command })
  </script>
  <style>
  button {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    padding: 8px 12px;
    flex-grow: 1;
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
    text-wrap: nowrap;
  }
  .action-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
    max-width: 180px;
    margin: 0 auto;
  }
  </style>
  <body>
    <div style="text-align: center">
      <p>
        Slidev server not found on <code>${previewOrigin.value}</code>
      </p>
      <p>
        please start the server first.
      </p>
      <div class="action-container">
        <button onclick="sendCommand('start-dev')"> Start Dev Server </button>
        <button onclick="sendCommand('config-port')"> Configure Port </button>
      </div>
    </div>
  </body>
  `
}
