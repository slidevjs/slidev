import { defineComponent, resolveDirective, VNode, withDirectives } from 'vue'

export default defineComponent({
  render() {
    const click = resolveDirective('click')!

    function applyDirective(node: VNode) {
      // @ts-expect-error
      if (node.dirs?.find(i => i.dir.name && ['v-click', 'v-after'].includes(i.dir.name)))
        return node
      return withDirectives(node, [[click]])
    }

    const defaults = this.$slots.default?.()

    if (!defaults)
      return

    if (Array.isArray(defaults))
      return defaults.map(i => applyDirective(i))

    return applyDirective(defaults)
  },
})
