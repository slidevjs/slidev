import type { App, ObjectDirective } from 'vue'
import { watch } from 'vue'
import { MotionDirective } from '@vueuse/motion'
import type { ResolvedClicksInfo } from '@slidev/types'
import { injectionClickVisibility, injectionClicksContext, injectionCurrentPage, injectionRenderContext } from '../constants'
import { useNav } from '../composables/useNav'
import { makeId } from '../logic/utils'
import { directiveInject } from '../utils'
import type { VClickValue } from './v-click'
import { resolveClick } from './v-click'

export type MotionDirectiveValue = undefined | VClickValue | {
  key?: string
  at?: VClickValue
}

export function createVMotionDirectives() {
  return {
    install(app: App) {
      const original = MotionDirective() as ObjectDirective
      app.directive<HTMLElement | SVGElement, string>('motion', {
        // @ts-expect-error extra prop
        name: 'v-motion',
        mounted(el, binding, node, prevNode) {
          const props = node.props = { ...node.props }

          const variantInitial = { ...props.initial, ...props.variants?.['slidev-initial'] }
          const variantEnter = { ...props.enter, ...props.variants?.['slidev-enter'] }
          const variantLeave = { ...props.leave, ...props.variants?.['slidev-leave'] }
          delete props.initial
          delete props.enter
          delete props.leave

          const idPrefix = `${makeId()}-`
          const clicks: {
            id: string
            at: number | [number, number]
            variant: Record<string, unknown>
            resolved: ResolvedClicksInfo | null
          }[] = []

          for (const k of Object.keys(props)) {
            if (k.startsWith('click-')) {
              const s = k.slice(6)
              const at = s.includes('-') ? s.split('-').map(Number) as [number, number] : +s
              const id = idPrefix + s
              clicks.push({
                id,
                at,
                variant: { ...props[k] },
                resolved: resolveClick(id, binding, at),
              })
              delete props[k]
            }
          }

          clicks.sort((a, b) => (Array.isArray(a.at) ? a.at[0] : a.at) - (Array.isArray(b.at) ? b.at[0] : b.at))

          original.created!(el, binding, node, prevNode)
          original.mounted!(el, binding, node, prevNode)

          const thisPage = directiveInject(binding, injectionCurrentPage)
          const renderContext = directiveInject(binding, injectionRenderContext)
          const clickVisibility = directiveInject(binding, injectionClickVisibility)
          const clicksContext = directiveInject(binding, injectionClicksContext)
          const { currentPage, clicks: currentClicks, isPrintMode } = useNav()
          // @ts-expect-error extra prop
          const motion = el.motionInstance
          motion.clickIds = clicks.map(i => i.id)
          motion.set(variantInitial)
          motion.watchStopHandle = watch(
            [thisPage, currentPage, currentClicks].filter(Boolean),
            () => {
              const visibility = clickVisibility?.value ?? true
              if (!clicksContext?.value || !['slide', 'presenter'].includes(renderContext?.value ?? '')) {
                const mixedVariant: Record<string, unknown> = { ...variantInitial, ...variantEnter }
                for (const { variant } of clicks)
                  Object.assign(mixedVariant, variant)

                motion.set(mixedVariant)
              }
              else if (isPrintMode.value || thisPage?.value === currentPage.value) {
                if (visibility === true) {
                  const mixedVariant: Record<string, unknown> = { ...variantInitial, ...variantEnter }
                  for (const { variant, resolved: resolvedClick } of clicks) {
                    if (!resolvedClick || resolvedClick.isActive.value)
                      Object.assign(mixedVariant, variant)
                  }
                  if (isPrintMode.value)
                    motion.set(mixedVariant) // print with clicks
                  else
                    motion.apply(mixedVariant)
                }
                else {
                  motion.apply(visibility === 'before' ? variantInitial : variantLeave)
                }
              }
              else {
                motion.apply((thisPage?.value ?? -1) > currentPage.value ? variantInitial : variantLeave)
              }
            },
            {
              immediate: true,
            },
          )
        },
        unmounted(el, dir) {
          if (!directiveInject(dir, injectionClicksContext)?.value)
            return

          const ctx = directiveInject(dir, injectionClicksContext)?.value
          // @ts-expect-error extra prop
          const motion = el.motionInstance
          motion.clickIds.map((id: string) => ctx?.unregister(id))
          motion.watchStopHandle()
        },
      })
    },
  }
}
