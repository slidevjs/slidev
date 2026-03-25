import type { ClicksElement, Frontmatter, RawAtValue } from '@slidev/types'
import type { App, DirectiveBinding } from 'vue'
import { computed, watchEffect } from 'vue'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
  CLICK_ANIMATION_PRESETS,
  injectionClicksContext,
  injectionFrontmatter,
  injectionSlidevContext,
  RESERVED_CLICK_MODIFIERS,
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

            const className = resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN
            const animation = resolved.flagAnimation.value

            if (resolved.flagHide) {
              el.classList.toggle(className, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(className, !active)
            }

            if (animation && el.dataset.clickAnimation !== animation)
              el.dataset.clickAnimation = animation
            else if (!animation && el.dataset.clickAnimation)
              delete el.dataset.clickAnimation

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

            const className = resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN
            const animation = resolved.flagAnimation.value

            if (resolved.flagHide) {
              el.classList.toggle(className, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(className, !active)
            }

            if (animation && el.dataset.clickAnimation !== animation)
              el.dataset.clickAnimation = animation
            else if (!animation && el.dataset.clickAnimation)
              delete el.dataset.clickAnimation

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

            const className = resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN
            const animation = resolved.flagAnimation.value

            el.classList.toggle(className, active)
            el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)

            if (animation && el.dataset.clickAnimation !== animation)
              el.dataset.clickAnimation = animation
            else if (!animation && el.dataset.clickAnimation)
              delete el.dataset.clickAnimation

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
  const frontmatter = directiveInject<Frontmatter>(dir, injectionFrontmatter)
  const slidev = directiveInject(dir, injectionSlidevContext)

  if (!el || !ctx)
    return null

  const flagHide = explicitHide || (dir.modifiers.hide !== false && dir.modifiers.hide != null)
  const flagFade = dir.modifiers.fade !== false && dir.modifiers.fade != null

  const flagAnimation = computed(() => {
    const modifiers = Object.keys(dir.modifiers).filter(m => !(RESERVED_CLICK_MODIFIERS as readonly string[]).includes(m))
    const modifier = modifiers[0]
    if (modifiers.length > 1 && __DEV__)
      console.warn(`[slidev] Multiple animation presets detected on v-click: ${modifiers.join(', ')}. Only the first one will be used.`)

    const animation = modifier || frontmatter?.clickAnimation || slidev?.configs.clickAnimation

    if (animation && !(CLICK_ANIMATION_PRESETS as readonly string[]).includes(animation) && __DEV__)
      console.warn(`[slidev] Unknown animation preset: "${animation}". Available presets are: ${CLICK_ANIMATION_PRESETS.join(', ')}`)

    return animation
  })

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
    flagAnimation,
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
