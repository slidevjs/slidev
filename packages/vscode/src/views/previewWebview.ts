import { computed, onScopeDispose, reactive, ref, shallowRef, watch, watchEffect } from '@vue/runtime-core'
import type { WebviewView } from 'vscode'
import { Uri, commands, env, window } from 'vscode'
import { useFocusedSlideNo } from '../composables/useFocusedSlideNo'
import { useVscodeContext } from '../composables/useVscodeContext'
import { configuredPort, isDarkTheme, previewSync } from '../config'
import { extCtx } from '../index'
import { activeProject, activeSlidevData } from '../projects'
import { createSingletonComposable } from '../utils/singletonComposable'
import { useLogger } from './logger'

const previewPort = computed(() => activeProject.value?.port)
const detectingPort = computed(() => previewPort.value ?? configuredPort.value)
const detectingOrigin = computed(() => `http://localhost:${detectingPort.value}`)
const detectingUrl = computed(() => `${detectingOrigin.value}?embedded=true`)

const usePreviewHtml = createSingletonComposable(() => {
  const logger = useLogger()

  const state = reactive({
    type: 'pending' as 'pending' | 'ready' | 'error',
    message: '',
  })

  const html = computed(() =>
    state.type === 'pending'
      ? generatePendingHtml()
      : state.type === 'ready'
        ? generateReadyHtml()
        : generateErrorHtml(),
  )

  let isWorking = false
  async function refreshState(setPending: boolean) {
    if (!previewPort.value) {
      state.type = 'error'
      state.message = 'Server is down'
      return
    }
    setPending && (state.type = 'pending')
    if (isWorking)
      return
    isWorking = true
    state.message = ''
    async function pingUrl(url: string) {
      try {
        if ((await (await fetch(url)).text()).includes('Slidev.js'))
          return true
      }
      catch (err) {
        state.message = String(err)
      }
      return false
    }
    // Not sure why we can't use `localhost:` here
    const ok = await pingUrl(`http://[::1]:${detectingPort.value}`) || await pingUrl(`http://127.0.0.1:${detectingPort.value}`)
    state.type = ok ? 'ready' : 'error'
    logger.info(`Preview state refreshed: ${state.type}. message: ${state.message}`)
    isWorking = false
    // if (ok && activeProject.value && !previewPort.value) {
    //   // TODO: not active project?
    //   activeProject.value.port = detectingPort.value
    //   refreshState(true)
    // }
  }

  refreshState(true)
  watch([previewPort, detectingPort], () => refreshState(true))

  const interval = setInterval(() => refreshState(false), 4000)
  onScopeDispose(() => clearInterval(interval))

  useVscodeContext('slidev-connected', () => state.type === 'ready', () => state.type !== 'pending')

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

  const pageId = ref(0)
  watch([view, html, detectingUrl], () => {
    if (!view.value)
      return
    view.value.webview.html = html.value
    logger.info(`Webview refreshed. Current URL: ${detectingUrl.value}`)
    setTimeout(() => pageId.value++, 300)
  })

  function postMessage(type: string, data: Record<string, unknown>) {
    view.value?.webview.postMessage({
      target: 'slidev',
      sender: 'vscode',
      type,
      ...data,
    })
  }

  watch([pageId, previewSync, focusedSlideNo], ([_, sync, no]) => sync && postMessage('navigate', { no, clicks: 999999 }))
  watch([pageId], () => postMessage('css-vars', { '--slidev-slide-container-background': 'transparent' }))
  watch([pageId, isDarkTheme], ([_, dark]) => postMessage('color-schema', { color: dark ? 'dark' : 'light' }))

  watchEffect(() => {
    if (view.value) {
      if (state.type === 'ready' && previewNavState.no > 0)
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
    refresh: (setPending = true) => refreshState(setPending),
    retry: () => state.type === 'error' && refreshState(false),
    previewNavState,
    nextClick: useNavOperation('next'),
    prevClick: useNavOperation('prev'),
    nextSlide: useNavOperation('nextSlide', true),
    prevSlide: useNavOperation('prevSlide', true),
    openExternal: () => {
      const query = previewNavState.clicks > 0 ? `?clicks=${previewNavState.clicks}` : ''
      const url = `${detectingOrigin.value}/${previewNavState.no}${query}`
      return env.openExternal(Uri.parse(url))
    },
  }
})

function generatePendingHtml() {
  return `
  <body>
    <p style="text-align: center">
      Connecting to <code>${detectingUrl.value}</code>
    </p>
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
    <iframe id="iframe" sandbox="allow-same-origin allow-scripts" src="${detectingUrl.value}"></iframe>
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
  </head>
  <body>
    <div style="text-align: center">
      <p>
        Slidev server not found on <code>${detectingOrigin.value}</code>
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
