import { computed, defineService, extensionContext, reactive, ref, useIsDarkTheme, useVscodeContext, useWebviewView, watch, watchEffect } from 'reactive-vscode'
import { commands, env, Uri, window } from 'vscode'
import { useFocusedSlide } from '../composables/useFocusedSlide'
import { useServerDetector } from '../composables/useServerDetector'
import { configuredPort, previewSync } from '../configs'
import { generateErrorHtml } from '../html/error'
import { generateReadyHtml } from '../html/ready'
import { activeData, activeProject } from '../projects'
import { logger } from './logger'

export const usePreviewWebview = defineService(() => {
  const { focusedSlideNo, focusSlide } = useFocusedSlide()
  const isDarkTheme = useIsDarkTheme()

  const { redetect } = useServerDetector()
  const port = computed(() => activeProject.value?.port.value || configuredPort.value)
  const detected = computed(() => activeProject.value ? activeProject.value.detected.value : null)
  const message = computed(() => detected.value?.message ?? '')
  const compatMode = useVscodeContext('slidev:preview:compat', () => !!detected.value?.compatMode)
  const ready = useVscodeContext('slidev:preview:ready', () => activeProject.value && !!detected.value?.ready)
  const html = computed(() => ready.value
    ? generateReadyHtml(port.value)
    : generateErrorHtml(message.value),
  )
  useVscodeContext('slidev:preview:sync', previewSync)

  const previewNavState = reactive({
    no: 0,
    clicks: 0,
    hasNext: true,
    hasPrev: false,
  })

  useVscodeContext('slidev:preview:has-prev-slide', () => previewNavState.no > 1)
  useVscodeContext('slidev:preview:has-next-slide', () => activeData.value && previewNavState.no < activeData.value.slides.length)
  useVscodeContext('slidev:preview:has-next-click', () => previewNavState.hasNext)
  useVscodeContext('slidev:preview:has-prev-click', () => previewNavState.hasPrev)

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
    redetect(port.value)
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

  watch([pageId], () => postSlidevMessage('css-vars', { '--slidev-slide-container-background': 'transparent' }))
  watch([pageId, isDarkTheme], ([_, dark]) => postSlidevMessage('color-schema', { color: dark ? 'dark' : 'light' }))

  watchEffect(() => {
    if (view.value) {
      const slideNo = ready.value && previewNavState.no > 0 ? ` (${previewNavState.no}/${activeData.value?.slides.length})` : ''
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

  watch(
    () => previewNavState.no,
    (no) => {
      if (ready.value && previewSync.value && activeProject.value) {
        focusSlide(activeProject.value, no)
      }
    },
  )
  watch(
    () => [previewSync.value, focusedSlideNo.value] as const,
    ([enabled, no]) => {
      if (enabled && no != null && previewNavState.no !== no) {
        postSlidevMessage('navigate', { no, clicks: 999999 })
      }
    },
  )

  return {
    view,
    refresh,
    retry: () => !ready.value && refresh(),
    nextClick: useNavOperation('next'),
    prevClick: useNavOperation('prev'),
    nextSlide: useNavOperation('nextSlide', true),
    prevSlide: useNavOperation('prevSlide', true),
    openExternal: () => {
      const hashRoute = activeData.value?.slides[0]?.frontmatter.routerMode === 'hash'
      const query = previewNavState.clicks > 0 ? `?clicks=${previewNavState.clicks}` : ''
      const url = `http://localhost:${port.value}/${hashRoute ? '#' : ''}${previewNavState.no}${query}`
      return env.openExternal(Uri.parse(url))
    },
  }
})
