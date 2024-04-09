import type { ResolvedClicksInfo } from '@slidev/types'
import type { App, DirectiveBinding } from 'vue'
import { computed, watchEffect } from 'vue'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
  injectionClickVisibility,
  injectionClicksContext,
} from '../constants'
import { directiveInject, directiveProvide } from '../utils'

export type VClickValue = undefined | string | number | [string | number, string | number] | boolean

export function createVClickDirectives() {
  return {
    install(app: App) {
      app.directive<HTMLElement, VClickValue>('click', {
        // @ts-expect-error extra prop
        name: 'v-click',

        mounted(el, dir) {
          const resolved = resolveClick(el, dir, dir.value, true)
          if (resolved == null)
            return

          el.classList.toggle(CLASS_VCLICK_TARGET, true)

          // Expose the resolved clicks info to the element to make it easier to understand and debug
          const clicks = Array.isArray(resolved.clicks) ? resolved.clicks : [resolved.clicks, undefined]
          el.dataset.slidevClicksStart = String(clicks[0])
          if (clicks[1] != null)
            el.dataset.slidevClicksEnd = String(clicks[1])

          // @ts-expect-error extra prop
          el.watchStopHandle = watchEffect(() => {
            const active = resolved.isActive.value
            const current = resolved.isCurrent.value
            const prior = active && !current

            if (resolved.flagHide) {
              el.classList.toggle(resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN, !active)
            }

            el.classList.toggle(CLASS_VCLICK_CURRENT, current)
            el.classList.toggle(CLASS_VCLICK_PRIOR, prior)
          })
        },
        unmounted,
      })

      app.directive<HTMLElement, VClickValue>('after', {
        // @ts-expect-error extra prop
        name: 'v-after',

        mounted(el, dir) {
          const resolved = resolveClick(el, dir, dir.value, true, true)
          if (resolved == null)
            return

          el.classList.toggle(CLASS_VCLICK_TARGET, true)

          // @ts-expect-error extra prop
          el.watchStopHandle = watchEffect(() => {
            const active = resolved.isActive.value
            const current = resolved.isCurrent.value
            const prior = active && !current

            if (resolved.flagHide) {
              el.classList.toggle(resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN, !active)
            }

            el.classList.toggle(CLASS_VCLICK_CURRENT, current)
            el.classList.toggle(CLASS_VCLICK_PRIOR, prior)
          })
        },
        unmounted,
      })

      app.directive<HTMLElement, VClickValue>('click-hide', {
        // @ts-expect-error extra prop
        name: 'v-click-hide',

        mounted(el, dir) {
          const resolved = resolveClick(el, dir, dir.value, true, false, true)
          if (resolved == null)
            return

          el.classList.toggle(CLASS_VCLICK_TARGET, true)

          // @ts-expect-error extra prop
          el.watchStopHandle = watchEffect(() => {
            const active = resolved.isActive.value
            const current = resolved.isCurrent.value
            const prior = active && !current

            el.classList.toggle(resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN, active)
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

function isClickActive(thisClick: number | [number, number], clicks: number) {
  return Array.isArray(thisClick)
    ? thisClick[0] <= clicks && clicks < thisClick[1]
    : thisClick <= clicks
}

function isClickCurrent(thisClick: number | [number, number], clicks: number) {
  return Array.isArray(thisClick)
    ? thisClick[0] === clicks
    : thisClick === clicks
}

export function resolveClick(el: Element | string, dir: DirectiveBinding<any>, value: VClickValue, provideVisibility = false, clickAfter = false, flagHide = false): ResolvedClicksInfo | null {
  const ctx = directiveInject(dir, injectionClicksContext)?.value

  if (!el || !ctx)
    return null

  if (value === false || value === 'false')
    return null

  flagHide ||= dir.modifiers.hide !== false && dir.modifiers.hide != null
  const flagFade = dir.modifiers.fade !== false && dir.modifiers.fade != null

  if (clickAfter)
    value = '+0'
  else if (value == null || value === true || value === 'true')
    value = '+1'

  let delta: number
  let thisClick: number | [number, number]
  let maxClick: number
  if (Array.isArray(value)) {
    // range (absolute)
    delta = 0
    thisClick = [+value[0], +value[1]]
    maxClick = +value[1]
  }
  else {
    ({ start: thisClick, end: maxClick, delta } = ctx.resolve(value))
  }

  const isActive = computed(() => isClickActive(thisClick, ctx.current))
  const isCurrent = computed(() => isClickCurrent(thisClick, ctx.current))
  const isShown = computed(() => flagHide ? !isActive.value : isActive.value)

  const resolved: ResolvedClicksInfo = {
    max: maxClick,
    clicks: thisClick,
    delta,
    isActive,
    isCurrent,
    isShown,
    flagFade,
    flagHide,
  }
  ctx.register(el, resolved)

  if (provideVisibility) {
    directiveProvide(dir, injectionClickVisibility, computed(() => {
      if (isShown.value)
        return true
      if (Array.isArray(thisClick))
        return ctx.current < thisClick[0] ? 'before' : 'after'
      else
        return flagHide ? 'after' : 'before'
    }))
  }

  return resolved
}

function unmounted(el: HTMLElement, dir: DirectiveBinding<any>) {
  el.classList.toggle(CLASS_VCLICK_TARGET, false)
  const ctx = directiveInject(dir, injectionClicksContext)?.value
  ctx?.unregister(el)
  // @ts-expect-error extra prop
  el.watchStopHandle?.()
}
