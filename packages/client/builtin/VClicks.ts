import { toArray } from '@antfu/utils'
import { defineComponent, Directive, h, isVNode, resolveDirective, VNode, withDirectives } from 'vue'

export default defineComponent({
  props: {
    every: {
      type: Number,
      default: 1,
    },
  },
  render() {
    const click = resolveDirective('click')!
    const after = resolveDirective('after')!

    function applyDirective(node: VNode, directive: Directive) {
      return withDirectives(node, [[directive]])
    }

    let defaults = this.$slots.default?.()

    if (!defaults)
      return

    defaults = toArray(defaults)

    // handle ul list
    if (defaults.length === 1 && defaults[0].type === 'ul' && Array.isArray(defaults[0].children)) {
      defaults[0].children = defaults[0].children.map((i, idx) => isVNode(i) ? applyDirective(h(i), idx % this.every === 0 ? click : after) : i)
      return defaults
    }

    return defaults.map((i, idx) => applyDirective(h(i), idx % this.every === 0 ? click : after))
  },
})
