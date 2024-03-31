import type { App, ObjectDirective } from 'vue'
import { watchEffect } from 'vue'
import type { MotionInstance } from '@vueuse/motion'
import { MotionDirective } from '@vueuse/motion'
import type { ResolvedClicksInfo } from '@slidev/types'
import { injectionClicksContext, injectionCurrentPage } from '../constants'
import { useNav } from '../composables/useNav'
import { makeId } from '../logic/utils'
import type { VClickValue } from './v-click'
import { dirInject, resolveClick } from './v-click'

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
          const props = node.props ??= {}
          const variants = node.props.variants ?? {}
          node.props = {
            ...props,
            variants: {
              ...variants,
              'slidev-before': { ...props.initial, ...variants.initial, ...props['slidev-before'] },
              'slidev-current': { ...props.enter, ...variants.enter, ...props['slidev-current'] },
              'slidev-after': { ...props.leave, ...variants.leave, ...props['slidev-after'] },
              'initial': variants['vmotion-initial'],
              'enter': variants['vmotion-enter'],
              'leave': variants['vmotion-leave'],
            },
            initial: undefined,
            enter: undefined,
            leave: undefined,
          }

          const idPrefix = `${makeId()}-`
          const clicks: {
            id: string
            at: number | [number, number]
            variant: string
            resolved: ResolvedClicksInfo | null
          }[] = []

          for (const k of Object.keys(node.props)) {
            if (k.startsWith('click-')) {
              const s = k.slice(6)
              const at = s.includes('-') ? s.split('-').map(Number) as [number, number] : +s
              const id = idPrefix + s
              clicks.push({
                id,
                at,
                variant: k,
                resolved: resolveClick(id, binding, at),
              })
              node.props.variants[k] = node.props[k]
              delete node.props[k]
            }
          }

          clicks.sort((a, b) => -(Array.isArray(a.at) ? a.at[0] : a.at) - (Array.isArray(b.at) ? b.at[0] : b.at))

          original.created!(el, binding, node, prevNode)
          original.mounted!(el, binding, node, prevNode)

          const thisPage = dirInject(binding, injectionCurrentPage)?.value ?? -1
          const { currentPage } = useNav()
          // @ts-expect-error extra prop
          const motion = el.motionInstance
          motion.clickIds = clicks.map(i => i.id)
          motion.watchStopHandle = watchEffect(() => {
            if (thisPage === currentPage.value) {
              let hasClickState = false
              for (const { variant, resolved: resolvedClick } of clicks) {
                if (resolvedClick?.isActive.value) {
                  motion.variant.value = variant
                  hasClickState = true
                  break
                }
              }
              if (!hasClickState)
                motion.variant.value = 'slidev-current'
            }
            else {
              motion.variant.value = thisPage > currentPage.value ? 'slidev-before' : 'slidev-after'
            }
          })
        },
        unmounted(el, dir) {
          const ctx = dirInject(dir, injectionClicksContext)?.value
          // @ts-expect-error extra prop
          const motion = el.motionInstance
          motion.clickIds.map((id: string) => ctx?.unregister(id))
          motion.watchStopHandle()
        },
      })
    },
  }
}
