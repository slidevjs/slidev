import { defineComponent, Directive, h, resolveDirective, VNode, withDirectives } from 'vue'

export default defineComponent({
  props: {
    every: {
      default: 1,
    },
  },
  render() {
    const click = resolveDirective('click')!
    const after = resolveDirective('after')!

    function applyDirective(node: VNode, directive: Directive) {
      return withDirectives(node, [[directive]])
    }

    const defaults = this.$slots.default?.()

    if (!defaults)
      return

    if (Array.isArray(defaults))
      return defaults.map((i, idx) => applyDirective(h(i), idx % this.every === 0 ? click : after))

    return applyDirective(h(defaults), click)
  },
})
