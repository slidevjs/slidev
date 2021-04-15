import { defineComponent, Directive, resolveDirective, VNode, withDirectives } from 'vue'

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
      // @ts-expect-error
      if (node.dirs?.find(i => i.dir.name && ['v-click', 'v-after'].includes(i.dir.name)))
        return node
      return withDirectives(node, [[directive]])
    }

    const defaults = this.$slots.default?.()

    if (!defaults)
      return

    if (Array.isArray(defaults))
      return defaults.map((i, idx) => applyDirective(i, idx % this.every === 0 ? click : after))

    return applyDirective(defaults, click)
  },
})
