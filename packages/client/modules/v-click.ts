import type { ClicksElement, RawAtValue } from '@slidev/types'
import type { App, DirectiveBinding } from 'vue'
import { computed, watchEffect } from 'vue'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
  injectionClicksContext,
} from '../constants'
import { directiveInject } from '../utils'

export function createVClickDirectives() {
  return {
    install(app: App) {
      app.directive<HTMLElement, RawAtValue>('click', {
        // @ts-expect-error extra prop
        name: 'v-click',

        mounted(el, dir) {
          const resolved = resolveClick(el, dir, dir.value)
          if (resolved == null)
            return

          el.classList.toggle(CLASS_VCLICK_TARGET, true)

          // Expose the resolved clicks info to the element to make it easier to understand and debug
          el.dataset.slidevClicksStart = String(resolved.start)
          if (Number.isFinite(resolved.end))
            el.dataset.slidevClicksEnd = String(resolved.end)

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

      app.directive<HTMLElement, RawAtValue>('after', {
        // @ts-expect-error extra prop
        name: 'v-after',

        mounted(el, dir) {
          const resolved = resolveClick(el, dir, '+0')
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

      app.directive<HTMLElement, RawAtValue>('click-hide', {
        // @ts-expect-error extra prop
        name: 'v-click-hide',

        mounted(el, dir) {
          const resolved = resolveClick(el, dir, dir.value, true)
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

export const resolvedClickMap = new Map<ClicksElement, ReturnType<typeof resolveClick>>()

export function resolveClick(el: Element | string, dir: DirectiveBinding<any>, value: RawAtValue, explicitHide = false) {
  const ctx = directiveInject(dir, injectionClicksContext)?.value

  if (!el || !ctx)
    return null

  const flagHide = explicitHide || (dir.modifiers.hide !== false && dir.modifiers.hide != null)
  const flagFade = dir.modifiers.fade !== false && dir.modifiers.fade != null

  const info = ctx.calculate(value)
  if (!info)
    return null

  ctx.register(el, info)

  const isShown = computed(() => flagHide ? !info.isActive.value : info.isActive.value)
  const visibilityState = computed(() => {
    if (isShown.value)
      return 'shown'
    if (Number.isFinite(info.end))
      return ctx.current < info.start ? 'before' : 'after'
    else
      return flagHide ? 'after' : 'before'
  })

  const resolved = {
    ...info,
    isShown,
    visibilityState,
    flagFade,
    flagHide,
  }
  resolvedClickMap.set(el, resolved)
  return resolved
}

function unmounted(el: HTMLElement, dir: DirectiveBinding<any>) {
  el.classList.toggle(CLASS_VCLICK_TARGET, false)
  const ctx = directiveInject(dir, injectionClicksContext)?.value
  ctx?.unregister(el)
  // @ts-expect-error extra prop
  el.watchStopHandle?.()
}
