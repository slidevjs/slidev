import { ref } from 'vue'
import { useRouter } from 'vue-router'

export function useViewTransition() {
  const router = useRouter()
  const isViewTransition = ref(false)

  let viewTransitionFinish: undefined | (() => void)
  let viewTransitionAbort: undefined | (() => void)

  const supportViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document

  router.beforeResolve((to, from) => {
    const fromNo = from.meta.slide?.no
    const toNo = to.meta.slide?.no
    if (
      !(
        fromNo !== undefined && toNo !== undefined && (
          (from.meta.transition === 'view-transition' && fromNo < toNo)
          || (to.meta.transition === 'view-transition' && toNo < fromNo)
        )
      )
    ) {
      isViewTransition.value = false
      return
    }

    if (!supportViewTransition) {
      isViewTransition.value = false
      console.warn('View transition is not supported in your browser, fallback to normal transition.')
      return
    }

    isViewTransition.value = true
    const promise = new Promise<void>((resolve, reject) => {
      viewTransitionFinish = resolve
      viewTransitionAbort = reject
    })

    let changeRoute: () => void
    const ready = new Promise<void>(resolve => (changeRoute = resolve))

    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    const transition = document.startViewTransition(() => {
      changeRoute()
      return promise
    })

    transition.finished.then(() => {
      viewTransitionAbort = undefined
      viewTransitionFinish = undefined
    })
    return ready
  })

  if (supportViewTransition) {
    router.afterEach(() => {
      viewTransitionFinish?.()
      viewTransitionAbort?.()
    })
  }

  return isViewTransition
}
