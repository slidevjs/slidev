import { sum } from '@antfu/utils'
import type { ResolvedClicksInfo } from '@slidev/types'
import type { App, DirectiveBinding, InjectionKey } from 'vue'
import { computed, watchEffect } from 'vue'
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
  injectionClicksMap,
} from '../constants'
import { isClicksDisabled } from '../logic/nav'

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
          const resolved = resolveClick(el, dir)
          if (resolved == null)
            return

          el.classList.toggle(CLASS_VCLICK_TARGET, true)

          watchEffect(() => {
            const active = resolved.isActive.value
            const current = resolved.isCurrent.value
            const prior = active && !current

            if (resolved.clickHide) {
              el.classList.toggle(resolved.CLASS_HIDE, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(resolved.CLASS_HIDE, !active)
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
          const resolved = resolveClick(el, dir, true)
          if (resolved == null)
            return

          el.classList.toggle(CLASS_VCLICK_TARGET, true)

          watchEffect(() => {
            const active = resolved.isActive.value
            const current = resolved.isCurrent.value
            const prior = active && !current

            if (resolved.clickHide) {
              el.classList.toggle(resolved.CLASS_HIDE, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(resolved.CLASS_HIDE, !active)
            }

            el.classList.toggle(CLASS_VCLICK_CURRENT, current)
            el.classList.toggle(CLASS_VCLICK_PRIOR, prior)
          })
        },
        unmounted,
      })

      app.directive('click-hide', {
        // @ts-expect-error extra prop
        name: 'v-click-hide',

        mounted(el: HTMLElement, dir) {
          const resolved = resolveClick(el, dir, false, true)
          if (resolved == null)
            return

          el.classList.toggle(CLASS_VCLICK_TARGET, true)

          watchEffect(() => {
            const active = resolved.isActive.value
            const current = resolved.isCurrent.value
            const prior = active && !current

            el.classList.toggle(resolved.CLASS_HIDE, active)
            el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)

            el.classList.toggle(CLASS_VCLICK_CURRENT, current)
            el.classList.toggle(CLASS_VCLICK_PRIOR, prior)
          })
        },
        unmounted,
      })
    },
  }
}

function isActive(thisClick: number | [number, number], clicks: number) {
  return Array.isArray(thisClick)
    ? thisClick[0] <= clicks && clicks < thisClick[1]
    : thisClick <= clicks
}

function isCurrent(thisClick: number | [number, number], clicks: number) {
  return Array.isArray(thisClick)
    ? thisClick[0] === clicks
    : thisClick === clicks
}

type ClickInfo = null | (Required<ResolvedClicksInfo> & {
  clickHide: boolean
  CLASS_HIDE: string
})

function resolveClick(el: Element, dir: DirectiveBinding<any>, clickAfter = false, clickHide = false): ClickInfo {
  if (!el || isClicksDisabled.value || dirInject(dir, injectionClicksDisabled)?.value)
    return null

  if (dir.value === false || dir.value === 'false')
    return null

  const flow = dirInject(dir, injectionClicksFlow)
  const clicks = dirInject(dir, injectionClicks)
  const clicksMap = dirInject(dir, injectionClicksMap)

  if (!flow || !clicks || !clicksMap)
    return null

  clickHide ||= dir.modifiers.hide !== false && dir.modifiers.hide != null
  const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

  const value = dir.value

  if (!clickAfter) {
    if (value == null || value === true || value === 'true' || value === 'flow')
      flow.value.set(el, 1)
  }

  let thisClick: number | [number, number]
  let maxClick: number
  if (value == null || value === true || value === 'true' || value === 'flow') {
    // flow
    thisClick = sum(...flow.value.values())
    maxClick = thisClick
  }
  else if (Array.isArray(value)) {
    // range (absolute)
    thisClick = value as [number, number]
    maxClick = value[1]
  }
  else {
    // since (absolute)
    thisClick = +value
    maxClick = thisClick
  }

  const resolved = {
    max: maxClick,
    isActive: computed(() => isActive(thisClick, clicks.value)),
    isCurrent: computed(() => isCurrent(thisClick, clicks.value)),
    shows: computed(() => clickHide ? !isActive(thisClick, clicks.value) : isActive(thisClick, clicks.value)),
    clickHide,
    CLASS_HIDE: fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN,
  }
  clicksMap.value.set(el, resolved)
  return resolved
}

function unmounted(el: HTMLElement, dir: DirectiveBinding<any>) {
  el.classList.toggle(CLASS_VCLICK_TARGET, false)
  const elements = dirInject(dir, injectionClicksFlow)
  elements?.value.delete(el)
}
