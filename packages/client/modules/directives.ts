import type { App, DirectiveBinding, InjectionKey, Ref } from 'vue'
import { computed, watch, watchEffect } from 'vue'
import type { ClicksFlow, ResolvedClicksInfo } from '@slidev/types'
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
  injectionClicksMap,
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
          const clicksMap = dirInject(dir, injectionClicksMap)

          if (!flow || !clicks || !clicksMap)
            return

          const hide = dir.modifiers.hide !== false && dir.modifiers.hide != null
          const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

          if (dir.value == null || dir.value === true || dir.value === 'true' || dir.value === 'flow')
            flow.value.set(el, 1)
          const resolvedClick = resolveClick(dir.value, hide, flow.value, clicks)
          clicksMap.value.set(el, resolvedClick)

          const CLASS_HIDE = fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          watchEffect(() => {
            const active = resolvedClick.isActive.value
            const current = resolvedClick.isCurrent.value
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
          const clicksMap = dirInject(dir, injectionClicksMap)

          if (!flow || !clicks || !clicksMap)
            return

          const hide = dir.modifiers.hide !== false && dir.modifiers.hide != null
          const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

          const resolvedClick = resolveClick(dir.value, true, flow.value, clicks)
          clicksMap.value.set(el, resolvedClick)

          const CLASS_HIDE = fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          watch(
            clicks,
            () => {
              const active = resolvedClick.isActive.value
              const current = resolvedClick.isCurrent.value
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
          const clicksMap = dirInject(dir, injectionClicksMap)

          if (!flow || !clicks || !clicksMap)
            return

          const fade = dir.modifiers.fade !== false && dir.modifiers.fade != null

          if (dir.value == null || dir.value === true || dir.value === 'true' || dir.value === 'flow')
            flow.value.set(el, 1)
          const resolvedClick = resolveClick(dir.value, true, flow.value, clicks)
          clicksMap.value.set(el, resolvedClick)

          const CLASS_HIDE = fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN

          el?.classList.toggle(CLASS_VCLICK_TARGET, true)

          watch(
            clicks,
            () => {
              const active = resolvedClick.isActive.value
              const current = resolvedClick.isCurrent.value
              const prior = active && !current

              el.classList.toggle(CLASS_HIDE, active)
              el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, active)

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

type ClickInfo = Required<ResolvedClicksInfo>

function resolveClick(value: any, hide: boolean, flow: ClicksFlow, clicks: Ref<number>): ClickInfo {
  let thisClick: number | [number, number]
  let maxClick: number
  if (value == null || value === true || value === 'true' || value === 'flow') {
    // flow
    thisClick = sum(...flow.values())
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

  return {
    max: maxClick,
    isActive: computed(() => isActive(thisClick, clicks.value)),
    isCurrent: computed(() => isCurrent(thisClick, clicks.value)),
    shows: computed(() => hide ? !isActive(thisClick, clicks.value) : isActive(thisClick, clicks.value)),
  }
}

function unmounted(el: HTMLElement, dir: DirectiveBinding<any>) {
  el?.classList.toggle(CLASS_VCLICK_TARGET, false)
  const elements = dirInject(dir, injectionClicksFlow)
  elements?.value.delete(el)
}
