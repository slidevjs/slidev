import { toArray } from '@antfu/utils'
import { defineComponent, Directive, h, resolveDirective, VNode, withDirectives } from 'vue'

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
