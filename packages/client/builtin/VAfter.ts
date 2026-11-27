/**
 * <v-after/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animation
 */

import type { Directive, VNode } from 'vue'
import { toArray } from '@antfu/utils'
import { defineComponent, h, resolveDirective, withDirectives } from 'vue'
import { VClickMount } from '../modules/v-click-mount'

export default defineComponent({
  props: {
    hide: {
      type: Boolean,
      default: false,
    },
    /**
     * Mount the content when the previous click is reached and unmount it when it's hidden,
     * instead of only toggling its visibility.
     */
    mount: {
      type: Boolean,
      default: false,
    },
  },
  render() {
    if (this.mount) {
      return h(
        VClickMount,
        {
          at: '+0',
          hide: this.hide,
        },
        {
          default: () => this.$slots.default?.(),
        },
      )
    }

    const after = resolveDirective('after')!
    const modifiers = { hide: this.hide }

    function applyDirective(node: VNode, directive: Directive) {
      return withDirectives(node, [
        [directive, undefined, '', modifiers],
      ])
    }

    let defaults = this.$slots.default?.()

    if (!defaults)
      return

    defaults = toArray(defaults)

    return defaults.map(i => applyDirective(h(i), after))
  },
})
