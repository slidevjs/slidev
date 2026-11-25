import type { App, Directive } from 'vue'

/** `querySelector` limited to the current `.slidev-page`. */
export type SlideQuery = <T extends Element = HTMLElement>(selector: string) => T | null

/** `querySelectorAll` limited to the current `.slidev-page`, as an array. */
export type SlideQueryAll = <T extends Element = HTMLElement>(selector: string) => T[]

/**
 * Callback for the `v-slide-el` directive.
 *
 * @param el - The element the directive is attached to.
 * @param $ - `querySelector` scoped to the containing `.slidev-page`.
 * @param $$ - `querySelectorAll` scoped to the containing `.slidev-page`.
 */
export type SlideElHandler = (
  el: HTMLElement,
  $: SlideQuery,
  $$: SlideQueryAll,
) => void

const SLIDE_PAGE_SELECTOR = '.slidev-page'

/**
 * Invoke a `v-slide-el` callback with helpers scoped to the slide that owns `el`.
 * No-ops when `el` is outside a slide or `value` is not a function.
 *
 * @param el - The element the directive is attached to.
 * @param value - The directive value. Functions are called; anything else is ignored.
 */
export function applySlideEl(el: HTMLElement, value: unknown) {
  const slide = el.closest(SLIDE_PAGE_SELECTOR)
  if (!slide || typeof value !== 'function')
    return

  const $: SlideQuery = <T extends Element = HTMLElement>(selector: string) => slide.querySelector<T>(selector)
  const $$: SlideQueryAll = <T extends Element = HTMLElement>(selector: string) => [
    ...slide.querySelectorAll<T>(selector),
  ]
  const callback = value as SlideElHandler
  callback(el, $, $$)
}

/**
 * Directive that runs a callback once on mount with slide-scoped DOM queries.
 *
 * Template usage: `v-slide-el="(el, $) => $('.foo')?.classList.add('bar')"`
 */
export function createVSlideElDirective() {
  const directive: Directive<HTMLElement, SlideElHandler> = {
    // @ts-expect-error extra prop, kept in line with the other Slidev directives
    name: 'v-slide-el',
    mounted(el, binding) {
      applySlideEl(el, binding.value)
    },
  }

  return {
    install(app: App) {
      app.directive('slide-el', directive)
    },
  }
}
