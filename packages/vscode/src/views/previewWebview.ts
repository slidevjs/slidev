import type { PreviewMode } from '../html/ready'
import { computed, defineService, extensionContext, reactive, ref, useIsDarkTheme, useVscodeContext, useWebviewView, watch, watchEffect } from 'reactive-vscode'
import { commands, env, Uri, window } from 'vscode'
import { useFocusedSlide } from '../composables/useFocusedSlide'
import { useServerDetector } from '../composables/useServerDetector'
import { config } from '../configs'
import { generateErrorHtml } from '../html/error'
import { generateReadyHtml } from '../html/ready'
import { activeData, activeProject } from '../projects'
import { logger } from './logger'

export const usePreviewWebview = defineService(() => {
  const { focusedSlideNo, viewportSlideNo, focusSlide, revealViewportSlide } = useFocusedSlide()
  const isDarkTheme = useIsDarkTheme()

  const { redetect } = useServerDetector()
  const port = computed(() => activeProject.value?.port.value || config.port)
  const detected = computed(() => activeProject.value ? activeProject.value.detected.value : null)
  const message = computed(() => detected.value?.message ?? '')
  const compatMode = useVscodeContext('slidev:preview:compat', () => !!detected.value?.compatMode)
  const ready = useVscodeContext('slidev:preview:ready', () => activeProject.value && !!detected.value?.ready)
  const savedPreviewMode = extensionContext.value?.globalState.get<PreviewMode>('slidev:preview:mode')
  const previewMode = ref<PreviewMode>(savedPreviewMode === 'overview' ? 'overview' : 'slide')
  const hashRoute = computed(() => activeData.value?.slides[0]?.frontmatter.routerMode === 'hash')
  const html = computed(() => ready.value
    ? generateReadyHtml(port.value, previewMode.value, hashRoute.value)
    : generateErrorHtml(message.value),
  )
  useVscodeContext('slidev:preview:sync', () => config['preview-sync'])
  useVscodeContext('slidev:preview:overview', () => previewMode.value === 'overview')

  const previewNavState = reactive({
    no: 0,
    clicks: 0,
    hasNext: true,
    hasPrev: false,
  })

  useVscodeContext('slidev:preview:has-prev-slide', () => previewMode.value === 'slide' && previewNavState.no > 1)
  useVscodeContext('slidev:preview:has-next-slide', () => previewMode.value === 'slide' && activeData.value && previewNavState.no < activeData.value.slides.length)
  useVscodeContext('slidev:preview:has-next-click', () => previewMode.value === 'slide' && previewNavState.hasNext)
  useVscodeContext('slidev:preview:has-prev-click', () => previewMode.value === 'slide' && previewNavState.hasPrev)

  const initializedClientId = ref('')
  let pendingOverviewScroll: { no: number } | undefined
  let overviewScrollTimer: ReturnType<typeof setTimeout> | undefined
  let syncEditorToOverviewUntil = 0

  function cancelPendingOverviewScroll() {
    pendingOverviewScroll = undefined
    if (overviewScrollTimer) {
      clearTimeout(overviewScrollTimer)
      overviewScrollTimer = undefined
    }
  }

  const { view, postMessage, forceReload } = useWebviewView(
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
          commands.executeCommand(`slidev.${data.command}`, ...(data.args ?? []))
        }
        else if (data.type === 'update-state') {
          if (initializedClientId.value === data.clientId) {
            Object.assign(previewNavState, data.navState)
          }
          else {
            initializedClientId.value = data.clientId
            if (previewMode.value === 'slide' && config['preview-sync'] && focusedSlideNo.value != null)
              postSlidevMessage('navigate', { no: focusedSlideNo.value })
          }
        }
        else if (data.type === 'overview-scroll') {
          syncEditorToOverviewUntil = Date.now() + 300
          cancelPendingOverviewScroll()
          const no = Number(data.no)
          if (previewMode.value === 'overview' && config['preview-sync'] && Number.isFinite(no))
            revealViewportSlide(no)
        }
      },
    },
  )

  const pageId = ref(0)
  async function refresh() {
    if (!ready.value)
      await redetect(port.value)
    if (!view.value)
      return
    forceReload()
    logger.info(`Webview refreshed. Current URL: http://localhost:${port.value}`)
    setTimeout(() => pageId.value++, 300)
  }
  watch([ready, view, port, previewMode], refresh)

  function postSlidevMessage(type: string, data: Record<string, unknown>) {
    return postMessage({
      target: 'slidev',
      sender: 'vscode',
      type,
      ...data,
    })
  }

  function scrollOverviewToSlide(no: number) {
    if (Date.now() < syncEditorToOverviewUntil)
      return
    pendingOverviewScroll = { no }
    if (overviewScrollTimer)
      return
    overviewScrollTimer = setTimeout(() => {
      overviewScrollTimer = undefined
      const scroll = pendingOverviewScroll
      pendingOverviewScroll = undefined
      if (scroll && Date.now() >= syncEditorToOverviewUntil && previewMode.value === 'overview' && config['preview-sync'])
        postSlidevMessage('overview-scroll', scroll)
    }, 50)
  }

  watch([pageId], () => {
    postSlidevMessage('css-vars', { '--slidev-slide-container-background': 'transparent' })
    if (previewMode.value === 'overview' && config['preview-sync'] && viewportSlideNo.value != null)
      scrollOverviewToSlide(viewportSlideNo.value)
  })
  watch([pageId, isDarkTheme], ([_, dark]) => postSlidevMessage('color-schema', { color: dark ? 'dark' : 'light' }))

  watchEffect(() => {
    if (view.value) {
      const slideNo = ready.value && previewMode.value === 'slide' && previewNavState.no > 0 ? ` (${previewNavState.no}/${activeData.value?.slides.length})` : ''
      const modeInfo = previewMode.value === 'overview' ? ' (overview)' : ''
      const compatInfo = compatMode.value ? ' (compat mode)' : ''
      view.value.title = `Preview${slideNo}${modeInfo}${compatInfo}`
    }
  })

  function useNavOperation(operation: string, ...args: unknown[]) {
    return () => {
      if (previewMode.value !== 'slide')
        return
      if (compatMode.value)
        window.showErrorMessage('Unsupported operation: Slidev server too old.')
      postSlidevMessage('navigate', { operation, args })
    }
  }

  watch(
    () => previewNavState.no,
    (no) => {
      if (previewMode.value === 'slide' && no > 0 && ready.value && config['preview-sync'] && activeProject.value) {
        focusSlide(activeProject.value, no)
      }
    },
  )
  watch(
    [() => config['preview-sync'], focusedSlideNo, viewportSlideNo, previewMode],
    ([enabled, focusedNo, viewportNo, mode]) => {
      if (enabled && mode === 'slide' && focusedNo != null && previewNavState.no !== focusedNo) {
        postSlidevMessage('navigate', { no: focusedNo, clicks: 999999 })
      }
      else if (enabled && mode === 'overview' && viewportNo != null) {
        scrollOverviewToSlide(viewportNo)
      }
    },
  )

  return {
    view,
    refresh,
    setPreviewMode: (mode: PreviewMode) => {
      initializedClientId.value = ''
      previewMode.value = mode
      void extensionContext.value?.globalState.update('slidev:preview:mode', mode)
    },
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
