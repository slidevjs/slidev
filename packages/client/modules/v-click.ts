import type { ClicksElement, RawAtValue } from '@slidev/types'
import type { App, DirectiveBinding } from 'vue'
import { computed, watchEffect } from 'vue'
import {
  CLASS_VCLICK_ANIMATION_PREFIX,
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
  injectionClicksContext,
  injectionFrontmatter,
} from '../constants'
import { configs } from '../env'
import { directiveInject } from '../utils'

function syncAnimationClasses(el: HTMLElement, animations: string[]) {
  const targetClasses = animations.map(a => `${CLASS_VCLICK_ANIMATION_PREFIX}${a}`)
  el.classList.forEach((c) => {
    if (c.startsWith(CLASS_VCLICK_ANIMATION_PREFIX) && !targetClasses.includes(c))
      el.classList.remove(c)
  })
  targetClasses.forEach(c => el.classList.add(c))
}

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
              el.classList.toggle(CLASS_VCLICK_HIDDEN, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(CLASS_VCLICK_HIDDEN, !active)
            }

            syncAnimationClasses(el, resolved.flagAnimations.value)

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
              el.classList.toggle(CLASS_VCLICK_HIDDEN, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)
            }
            else {
              el.classList.toggle(CLASS_VCLICK_HIDDEN, !active)
            }

            syncAnimationClasses(el, resolved.flagAnimations.value)

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

            el.classList.toggle(CLASS_VCLICK_HIDDEN, active)
            el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)

            syncAnimationClasses(el, resolved.flagAnimations.value)

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
  const frontmatter = directiveInject(dir, injectionFrontmatter)

  if (!el || !ctx)
    return null

  const flagHide = explicitHide || (dir.modifiers.hide !== false && dir.modifiers.hide != null)

  /**
   * Resolves the animation presets for this element.
   * Priority: directive modifiers (stacked) > slide frontmatter > global config.
   * Modifiers allow composition, e.g., v-click.fade.up.scale.
   */
  const elModifiers = Object.keys({ ...dir.modifiers }).filter(m => m !== 'hide')
  const flagAnimations = computed(() => {
    if (elModifiers.length > 0)
      return elModifiers
    const preset = frontmatter?.clickAnimation || configs.clickAnimation
    if (preset)
      return preset.split(/[\s,]+/).filter(Boolean)
    return []
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
    flagHide,
    flagAnimations,
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
