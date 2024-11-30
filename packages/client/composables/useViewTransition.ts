import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { configs } from '../env'
import { getSlide } from '../logic/slides'

export function useViewTransition() {
  const router = useRouter()
  const isViewTransition = ref(false)

  let viewTransitionFinish: undefined | (() => void)
  let viewTransitionAbort: undefined | (() => void)

  const supportViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document

  router.beforeResolve((to, from) => {
    const fromMeta = getSlide(from.params.no as string)?.meta
    const toMeta = getSlide(to.params.no as string)?.meta
    const fromNo = fromMeta?.slide?.no
    const toNo = toMeta?.slide?.no
    const transitionType = fromNo != null && toNo != null && fromNo !== toNo
      && ((fromNo < toNo ? fromMeta?.transition : toMeta?.transition) ?? configs.transition)
    if (transitionType !== 'view-transition') {
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

    // Wait for `TransitionGroup` to become normal `div`
    setTimeout(() => {
      document.startViewTransition(() => {
        changeRoute()
        return promise
      })
    }, 50)

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
