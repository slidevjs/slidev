import type { App, DirectiveBinding, InjectionKey } from 'vue'
import { watch, watchEffect } from 'vue'
import type { ClicksFlow } from '@slidev/types'
import { sum } from '@antfu/utils'
import { isClicksDisabled } from '../logic/nav'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
  injectionClicks,
  injectionClicksDisabled,
  injectionClicksFlow,
  injectionClicksMaxMap,
} from '../constants'

function dirInject<T = unknown>(dir: DirectiveBinding<any>, key: InjectionKey<T> | string, defaultValue?: T): T | undefined {
  return (dir.instance?.$ as any).provides[key as any] ?? defaultValue
}

export default function createDirectives() {
  return {
    install(app: App) {
      app.directive('click', {
        // @ts-expect-error extra prop
        name: 'v-click',

        mounted(el: HTMLElement, dir) {
          if (isClicksDisabled.value || dirInject(dir, injectionClicksDisabled)?.value)
            return

          if (dir.value === false || dir.value === 'false')
            return

          const flow = dirInject(dir, injectionClicksFlow)
          const clicks = dirInject(dir, injectionClicks)
          const maxMap = dirInject(dir, injectionClicksMaxMap)

          if (!flow || !clicks || !maxMap)
            return

          const hide = dir.modifiers.hide !== false && dir.modifiers.hide != null
          const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

          if (dir.value == null || dir.value === true || dir.value === 'true' || dir.value === 'flow')
            flow.value.set(el, 1)
          const { thisClick, maxClick } = resolveClick(dir.value, flow.value)
          maxMap.value.set(el, maxClick)

          const CLASS_HIDE = fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          watchEffect(() => {
            const active = isActive(thisClick, clicks.value)
            const current = isCurrent(thisClick, clicks.value)
            const prior = active && !current

            if (hide) {
              el.classList.toggle(CLASS_HIDE, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(CLASS_HIDE, !active)
            }

            el.classList.toggle(CLASS_VCLICK_CURRENT, current)
            el.classList.toggle(CLASS_VCLICK_PRIOR, prior)
          })
        },
        unmounted,
      })

      app.directive('after', {
        // @ts-expect-error extra prop
        name: 'v-after',

        mounted(el: HTMLElement, dir) {
          if (isClicksDisabled.value || dirInject(dir, injectionClicksDisabled)?.value)
            return

          if (dir.value === false || dir.value === 'false')
            return

          const flow = dirInject(dir, injectionClicksFlow)
          const clicks = dirInject(dir, injectionClicks)
          const maxMap = dirInject(dir, injectionClicksMaxMap)

          if (!flow || !clicks || !maxMap)
            return

          const hide = dir.modifiers.hide !== false && dir.modifiers.hide != null
          const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

          const thisClick = flow.value.size

          const CLASS_HIDE = fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          watch(
            clicks,
            () => {
              const active = isActive(thisClick, clicks.value)
              const current = isCurrent(thisClick, clicks.value)
              const prior = active && !current

              if (hide) {
                el.classList.toggle(CLASS_HIDE, active)
                el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
              }
              else {
                el.classList.toggle(CLASS_HIDE, !active)
              }

              el.classList.toggle(CLASS_VCLICK_CURRENT, current)
              el.classList.toggle(CLASS_VCLICK_PRIOR, prior)
            },
            { immediate: true },
          )
        },
        unmounted,
      })

      app.directive('click-hide', {
        // @ts-expect-error extra prop
        name: 'v-click-hide',

        mounted(el: HTMLElement, dir) {
          if (isClicksDisabled.value || dirInject(dir, injectionClicksDisabled)?.value)
            return

          if (dir.value === false || dir.value === 'false')
            return

          const flow = dirInject(dir, injectionClicksFlow)
          const clicks = dirInject(dir, injectionClicks)
          const maxMap = dirInject(dir, injectionClicksMaxMap)

          if (!flow || !clicks || !maxMap)
            return

          const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

          if (dir.value == null || dir.value === true || dir.value === 'true' || dir.value === 'flow')
            flow.value.set(el, 1)
          const { thisClick, maxClick } = resolveClick(dir.value, flow.value)
          maxMap.value.set(el, maxClick)

          const CLASS_HIDE = fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          watch(
            clicks,
            () => {
              const hide = isActive(thisClick, clicks.value)
              const current = isCurrent(thisClick, clicks.value)
              const prior = hide && !current

              el.classList.toggle(CLASS_HIDE, hide)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, hide)

              el.classList.toggle(CLASS_VCLICK_CURRENT, current)
              el.classList.toggle(CLASS_VCLICK_PRIOR, prior)
            },
            { immediate: true },
          )
        },
        unmounted,
      })
    },
  }
}

function resolveClick(dir: any, flow: ClicksFlow) {
  if (dir == null || dir === true || dir === 'true' || dir === 'flow') {
    // flow
    const thisClick = sum(...flow.values())
    return {
      thisClick,
      maxClick: thisClick,
    }
  }
  else if (Array.isArray(dir)) {
    // range (absolute)
    return {
      thisClick: dir as [number, number],
      maxClick: dir[1],
    }
  }
  else {
    // since (absolute)
    return {
      thisClick: +dir,
      maxClick: +dir,
    }
  }
}

function isActive(thisClicks: number | [number, number], clicks: number) {
  return Array.isArray(thisClicks)
    ? thisClicks[0] <= clicks && clicks < thisClicks[1]
    : thisClicks <= clicks
}

function isCurrent(thisClicks: number | [number, number], clicks: number) {
  return Array.isArray(thisClicks)
    ? thisClicks[0] === clicks
    : thisClicks === clicks
}

function unmounted(el: HTMLElement, dir: DirectiveBinding<any>) {
  el?.classList.toggle(CLASS_VCLICK_TARGET, false)
  const elements = dirInject(dir, injectionClicksFlow)
  elements?.value.delete(el)
}
