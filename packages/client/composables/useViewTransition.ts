import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSlide } from '../logic/slides'
import { configs } from '../env'

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
    if (
      !fromNo || !toNo
      || (configs.transition !== 'view-transition'
      && ((fromNo < toNo && fromMeta?.transition === 'view-transition')
      || (toNo < fromNo && toMeta?.transition === 'view-transition')))
    ) {
      isViewTransition.value = false
      return
    }

    if (!supportViewTransition) {
      isViewTransition.value = false
      console.warn('View transition is not supported in your browser, fallback to normal transition.')
      return
    }

    const becomeViewTransition = !isViewTransition.value
    isViewTransition.value = true
    const promise = new Promise<void>((resolve, reject) => {
      viewTransitionFinish = resolve
      viewTransitionAbort = reject
    })

    let changeRoute: () => void
    const ready = new Promise<void>(resolve => (changeRoute = resolve))

    const startViewTransition = () => {
      // @ts-expect-error missing types
      const transition = document.startViewTransition(() => {
        changeRoute()
        return promise
      })
      transition.finished.then(() => {
        viewTransitionAbort = undefined
        viewTransitionFinish = undefined
      })
    }

    if (becomeViewTransition) {
      // Wait for `TransitionGroup` to become normal `div`
      setTimeout(startViewTransition, 50)
    }
    else {
      startViewTransition()
    }

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
