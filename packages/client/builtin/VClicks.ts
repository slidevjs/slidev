/**
 * <v-clicks/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animations
 */

import { toArray } from '@antfu/utils'
import type { Directive, VNode, VNodeArrayChildren } from 'vue'

import { Comment, defineComponent, h, isVNode, resolveDirective, withDirectives } from 'vue'

const listTags = ['ul', 'ol']

export default defineComponent({
  props: {
    depth: {
      type: [Number, String],
      default: 1,
    },
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

    const applyDirective = (node: VNode, directive: Directive, delta: number | string) => {
      return withDirectives(node, [[
        directive,
        delta,
        '',
        {
          hide: this.hide,
          fade: this.fade,
        },
      ]])
    }

    let defaults = this.$slots.default?.()

    if (!defaults)
      return

    defaults = toArray(defaults)

    const mapSubList = (children: VNodeArrayChildren, depth = 1): [VNodeArrayChildren, number] => {
      let idx = 0
      const vNodes = children.map((i) => {
        if (!isVNode(i))
          return i
        if (listTags.includes(i.type as string) && Array.isArray(i.children)) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          const [vNodes, total] = mapChildren(i.children, depth + 1)
          idx += total
          return h(i, {}, [vNodes])
        }
        return h(i)
      })
      return [vNodes, idx]
    }

    let globalIdx = 0
    const mapChildren = (children: VNodeArrayChildren, depth = 1): [VNodeArrayChildren, number] => {
      let idx = 0
      const vNodes = children.map((i) => {
        if (!isVNode(i) || i.type === Comment)
          return i
        const directive = idx % this.every === 0 ? click : after
        let vNode
        let childCount = 0
        if (depth < +this.depth && Array.isArray(i.children)) {
          const [vNodes, total] = mapSubList(i.children, depth)
          vNode = h(i, {}, [vNodes])
          childCount = total
          idx += total + 1
        }
        else {
          vNode = h(i)
          idx++
        }
        const delta = this.at != null
          ? Number(this.at) + Math.floor(globalIdx / this.every) + depth
          : (depth - 1 - childCount).toString()
        globalIdx++
        return applyDirective(
          vNode,
          directive,
          (typeof delta === 'string' && !delta.startsWith('-')) ? `+${delta}` : delta,
        )
      })
      return [vNodes, idx]
    }

    // handle ul, ol list
    if (defaults.length === 1 && listTags.includes(defaults[0].type as string) && Array.isArray(defaults[0].children))
      return h(defaults[0], {}, [mapChildren(defaults[0].children)[0]])

    return mapChildren(defaults)[0]
  },
})
