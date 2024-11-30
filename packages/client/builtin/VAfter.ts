/**
 * <v-after/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animation
 */

import type { Directive, VNode } from 'vue'
import { toArray } from '@antfu/utils'
import { defineComponent, h, resolveDirective, withDirectives } from 'vue'

export default defineComponent({
  render() {
    const after = resolveDirective('after')!

    function applyDirective(node: VNode, directive: Directive) {
      return withDirectives(node, [[directive]])
    }

    let defaults = this.$slots.default?.()

    if (!defaults)
      return

    defaults = toArray(defaults)

    return defaults.map(i => applyDirective(h(i), after))
  },
})
