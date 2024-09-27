import type { RoughAnnotationConfig } from '@slidev/rough-notation'
import type { RawAtValue } from '@slidev/types'
import type { App } from 'vue'
import { annotate } from '@slidev/rough-notation'
import { computed, watchEffect } from 'vue'
import { resolveClick } from './v-click'

export interface RoughDirectiveOptions extends Partial<RoughAnnotationConfig> {
  at: RawAtValue
}

export type RoughDirectiveValue = RawAtValue | RoughDirectiveOptions

function addClass(options: RoughDirectiveOptions, cls: string) {
  options.class = [options.class, cls].filter(Boolean).join(' ')
  return options
}

// Definitions of supported modifiers
const vMarkModifiers: Record<string, (options: RoughDirectiveOptions, value?: any) => RoughDirectiveOptions> = {
  // Types
  'box': options => Object.assign(options, { type: 'box' }),
  'circle': options => Object.assign(options, { type: 'circle' }),
  'underline': options => Object.assign(options, { type: 'underline' }),
  'highlight': options => Object.assign(options, { type: 'highlight' }),
  'strike-through': options => Object.assign(options, { type: 'strike-through' }),
  'crossed-off': options => Object.assign(options, { type: 'crossed-off' }),
  'bracket': options => Object.assign(options, { type: 'bracket' }),

  // Type Aliases
  'strike': options => Object.assign(options, { type: 'strike-through' }),
  'cross': options => Object.assign(options, { type: 'crossed-off' }),
  'crossed': options => Object.assign(options, { type: 'crossed-off' }),
  'linethrough': options => Object.assign(options, { type: 'strike-through' }),
  'line-through': options => Object.assign(options, { type: 'strike-through' }),

  // Colors
  // @unocss-include
  'black': options => addClass(options, 'text-black'),
  'blue': options => addClass(options, 'text-blue'),
  'cyan': options => addClass(options, 'text-cyan'),
  'gray': options => addClass(options, 'text-gray'),
  'green': options => addClass(options, 'text-green'),
  'indigo': options => addClass(options, 'text-indigo'),
  'lime': options => addClass(options, 'text-lime'),
  'orange': options => addClass(options, 'text-orange'),
  'pink': options => addClass(options, 'text-pink'),
  'purple': options => addClass(options, 'text-purple'),
  'red': options => addClass(options, 'text-red'),
  'teal': options => addClass(options, 'text-teal'),
  'white': options => addClass(options, 'text-white'),
  'yellow': options => addClass(options, 'text-yellow'),
}

const vMarkModifiersDynamic: [RegExp, (match: RegExpMatchArray, options: RoughDirectiveOptions, value?: any) => RoughDirectiveOptions][] = [
  // Support setting delay like `v-mark.delay300="1"`
  [/^delay-?(\d+)?$/, (match, options, value) => {
    const ms = (match[1] ? Number.parseInt(match[1]) : value) || 300
    options.delay = ms
    return options
  }],
  // Support setting opacity like `v-mark.op50="1"`
  [/^(?:op|opacity)-?(\d+)?$/, (match, options, value) => {
    const opacity = (match[1] ? Number.parseInt(match[1]) : value) || 100
    options.opacity = opacity / 100
    return options
  }],
]

/**
 * This supports v-mark directive to add notations to elements, powered by `rough-notation`.
 */
export function createVMarkDirective() {
  return {
    install(app: App) {
      app.directive<HTMLElement, RoughDirectiveValue>('mark', {
        // @ts-expect-error extra prop
        name: 'v-mark',

        mounted: (el, binding) => {
          const options = computed(() => {
            const bindingOptions = (typeof binding.value === 'object' && !Array.isArray(binding.value))
              ? { ...binding.value }
              : { at: binding.value }

            let modifierOptions: RoughDirectiveOptions = { at: bindingOptions.at }
            const unknownModifiers = Object.entries(binding.modifiers)
              .filter(([k, v]) => {
                if (vMarkModifiers[k]) {
                  modifierOptions = vMarkModifiers[k](modifierOptions, v)
                  return false
                }
                for (const [re, fn] of vMarkModifiersDynamic) {
                  const match = k.match(re)
                  if (match) {
                    modifierOptions = fn(match, modifierOptions, v)
                    return false
                  }
                }
                return true
              })

            if (unknownModifiers.length)
              console.warn('[Slidev] Invalid modifiers for v-mark:', unknownModifiers)

            const options = {
              ...modifierOptions,
              ...bindingOptions,
            }
            options.type ||= 'underline'

            return options
          })

          const annotation = annotate(el, options.value as RoughAnnotationConfig)

          const resolvedClick = resolveClick(el, binding, options.value.at)
          if (!resolvedClick) {
            // No click animation, just show the mark
            annotation.show()
            return
          }

          // @ts-expect-error extra prop
          el.watchStopHandle = watchEffect(() => {
            let shouldShow: boolean | undefined

            if (options.value.class)
              annotation.class = options.value.class
            if (options.value.color)
              annotation.color = options.value.color

            const at = options.value.at

            if (at === true)
              shouldShow = true
            else if (at === false)
              shouldShow = false
            else
              shouldShow = resolvedClick.isActive.value

            if (shouldShow == null)
              return

            if (shouldShow)
              annotation.show()
            else
              annotation.hide()
          })
        },

        unmounted: (el) => {
          // @ts-expect-error extra prop
          el.watchStopHandle?.()
        },
      })
    },
  }
}
