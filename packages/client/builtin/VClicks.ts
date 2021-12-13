/**
 * <v-clicks/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animations
 */

import { toArray } from '@antfu/utils'
import type { Directive, VNode, VNodeArrayChildren } from 'vue'
import { defineComponent, h, isVNode, resolveDirective, withDirectives } from 'vue'

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
    fade: {
      type: Boolean,
      default: false,
    },
  },
  render() {
    const click = resolveDirective('click')!
    const after = resolveDirective('after')!

    const applyDirective = (node: VNode, directive: Directive, delta: number) =>
      withDirectives(node, [[
        directive,
        this.at != null
          ? +this.at + delta
          : null, '',
        {
          hide: this.hide,
          fade: this.fade,
        },
      ]])

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
