/**
 * <v-clicks/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animations
 */

import { toArray } from '@antfu/utils'
import { defineComponent, Directive, h, isVNode, resolveDirective, VNode, VNodeArrayChildren, withDirectives } from 'vue'

export default defineComponent({
  props: {
    every: {
      type: Number,
      default: 1,
    },
    at: {
      type: [Number, String],
      default: null,
    },
    hide: {
      type: Boolean,
      default: false,
    },
  },
  render() {
    const click = resolveDirective('click')!
    const after = resolveDirective('after')!

    const applyDirective = (node: VNode, directive: Directive, delta: number) => {
      if (this.at != null)
        return withDirectives(node, [[directive, +this.at + delta, '', { hide: this.hide }]])
      return withDirectives(node, [[directive, null, '', { hide: this.hide }]])
    }

    let defaults = this.$slots.default?.()

    if (!defaults)
      return

    defaults = toArray(defaults)

    const mapChildren = (children: VNodeArrayChildren) => {
      return children.map((i, idx) =>
        isVNode(i)
          ? applyDirective(
            h(i),
            idx % this.every === 0 ? click : after,
            Math.floor(idx / this.every),
          )
          : i,
      )
    }

    // handle ul, ol list
    if (defaults.length === 1 && ['ul', 'ol'].includes(defaults[0].type as string) && Array.isArray(defaults[0].children))
      return h(defaults[0], {}, [mapChildren(defaults[0].children)])

    return mapChildren(defaults)
  },
})
