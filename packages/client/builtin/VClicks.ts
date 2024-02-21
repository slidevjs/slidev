/**
 * <v-clicks/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animations
 */

import { toArray } from '@antfu/utils'
import type { VNode, VNodeArrayChildren } from 'vue'
import { Comment, createVNode, defineComponent, h, isVNode, resolveDirective, withDirectives } from 'vue'
import { normalizeAtProp } from '../logic/utils'
import VClickGap from './VClickGap.vue'

const listTags = ['ul', 'ol']

export default defineComponent({
  props: {
    depth: {
      type: [Number, String],
      default: 1,
    },
    every: {
      type: [Number, String],
      default: 1,
    },
    at: {
      type: [Number, String],
      default: '+1',
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
    const every = +this.every
    const [isRelative, at] = normalizeAtProp(this.at)

    const click = resolveDirective('click')!

    const applyDirective = (node: VNode, value: number | string) => {
      return withDirectives(node, [[
        click,
        value,
        '',
        {
          hide: this.hide,
          fade: this.fade,
        },
      ]])
    }

    const openAllTopLevelSlots = <T extends VNodeArrayChildren | VNode[]>(children: T): T => {
      return children.flatMap((i) => {
        if (isVNode(i) && typeof i.type === 'symbol' && Array.isArray(i.children))
          return openAllTopLevelSlots(i.children)
        else
          return [i]
      }) as T
    }

    let elements = this.$slots.default?.()

    if (!elements)
      return

    elements = openAllTopLevelSlots(toArray(elements))

    const mapSubList = (children: VNodeArrayChildren, depth = 1): VNodeArrayChildren => {
      const vNodes = openAllTopLevelSlots(children).map((i) => {
        if (!isVNode(i))
          return i
        if (listTags.includes(i.type as string) && Array.isArray(i.children)) {
          // eslint-disable-next-line ts/no-use-before-define
          const vNodes = mapChildren(i.children, depth + 1)
          return h(i, {}, vNodes)
        }
        return h(i)
      })
      return vNodes
    }

    let globalIdx = 1
    let execIdx = 0
    const mapChildren = (children: VNodeArrayChildren, depth = 1): VNodeArrayChildren => {
      const vNodes = openAllTopLevelSlots(children).map((i) => {
        if (!isVNode(i) || i.type === Comment)
          return i

        const thisShowIdx = +at + Math.ceil(globalIdx++ / every) - 1

        let vNode
        if (depth < +this.depth && Array.isArray(i.children))
          vNode = h(i, {}, mapSubList(i.children, depth))
        else
          vNode = h(i)

        const delta = thisShowIdx - execIdx
        execIdx = thisShowIdx

        return applyDirective(
          vNode,
          isRelative
            ? delta >= 0 ? `+${delta}` : `${delta}`
            : thisShowIdx,
        )
      })
      return vNodes
    }

    const lastGap = () => createVNode(VClickGap, {
      size: +at + Math.ceil((globalIdx - 1) / every) - 1 - execIdx,
    })

    // handle ul, ol list
    if (elements.length === 1 && listTags.includes(elements[0].type as string) && Array.isArray(elements[0].children))
      return h(elements[0], {}, [...mapChildren(elements[0].children), lastGap()])

    if (elements.length === 1 && elements[0].type as string === 'table') {
      const tableNode = elements[0]
      if (Array.isArray(tableNode.children)) {
        return h(tableNode, {}, tableNode.children.map((i) => {
          if (!isVNode(i))
            return i
          else if (i.type === 'tbody' && Array.isArray(i.children))
            return h(i, {}, [...mapChildren(i.children), lastGap()])
          else
            return h(i)
        }))
      }
    }

    return [...mapChildren(elements), lastGap()]
  },
})
