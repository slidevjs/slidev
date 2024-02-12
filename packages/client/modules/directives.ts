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
} from '../constants'
import { safeParseNumber } from '../logic/utils'

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
  const ctx = dirInject(dir, injectionClicks)?.value

  if (!el || !ctx || ctx.disabled)
    return null

  let value = dir.value

  if (value === false || value === 'false')
    return null

  clickHide ||= dir.modifiers.hide !== false && dir.modifiers.hide != null
  const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

  if (clickAfter)
    value = '+0'
  else if (value == null || value === true || value === 'true')
    value = '+1'

  let flowSize: number
  let thisClick: number | [number, number]
  let maxClick: number
  if (typeof value === 'string' && '+-'.includes(value[0])) {
    // flow
    flowSize = safeParseNumber(value)
    thisClick = ctx.flowSum + flowSize
    maxClick = thisClick
  }
  else if (Array.isArray(value)) {
    // range (absolute)
    flowSize = 0
    thisClick = value as [number, number]
    maxClick = value[1]
  }
  else {
    // since (absolute)
    flowSize = 0
    thisClick = safeParseNumber(value)
    maxClick = thisClick
  }

  const resolved = {
    max: maxClick,
    flowSize,
    isActive: computed(() => isActive(thisClick, ctx.current)),
    isCurrent: computed(() => isCurrent(thisClick, ctx.current)),
    shows: computed(() => clickHide ? !isActive(thisClick, ctx.current) : isActive(thisClick, ctx.current)),
    clickHide,
    CLASS_HIDE: fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN,
  }
  ctx.register(el, resolved)
  return resolved
}

function unmounted(el: HTMLElement, dir: DirectiveBinding<any>) {
  el.classList.toggle(CLASS_VCLICK_TARGET, false)
  const ctx = dirInject(dir, injectionClicks)?.value
  ctx?.unregister(el)
}
