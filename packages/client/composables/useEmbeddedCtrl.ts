import { throttledWatch } from '@vueuse/core'
import { useNav } from '../composables/useNav'
import { isDark } from '../logic/dark'

export function useEmbeddedControl() {
  const nav = useNav()
  const clientId = `${Date.now()}`

  window.addEventListener('message', ({ data }) => {
    if (data && data.target === 'slidev') {
      if (data.type === 'navigate') {
        if (data.no || data.clicks) {
          nav.go(+data.no, +data.clicks || 0)
        }
        else if (typeof data.operation === 'string') {
          const fn = nav[data.operation as keyof typeof nav]
          if (typeof fn === 'function')
            (fn as any)(...(data.args ?? []))
        }
      }
      else if (data.type === 'css-vars') {
        const root = document.documentElement
        for (const [key, value] of Object.entries(data.vars || {}))
          root.style.setProperty(key, value as any)
      }
      else if (data.type === 'color-schema') {
        isDark.value = data.color === 'dark'
      }
    }
  })

  if (nav.isEmbedded.value) {
    throttledWatch(
      [nav.currentSlideNo, nav.clicks, nav.hasNext, nav.hasPrev],
      ([no, clicks, hasNext, hasPrev]) => {
        window.parent.postMessage(
          {
            target: 'slidev',
            clientId,
            navState: {
              no,
              clicks,
              hasNext,
              hasPrev,
            },
          },
          '*',
        )
      },
      {
        throttle: 300,
        immediate: true,
      },
    )
  }
}
