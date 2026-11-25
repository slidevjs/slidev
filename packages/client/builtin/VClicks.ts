/**
 * <v-clicks/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animation
 */

import type { VNode, VNodeArrayChildren } from 'vue'
import { toArray } from '@antfu/utils'
import { Comment, createVNode, defineComponent, h, isVNode, resolveDirective, Text, withDirectives } from 'vue'
import { normalizeSingleAtValue } from '../composables/useClicks'
import VClickGap from './VClickGap.vue'

const listTags = ['ul', 'ol']
const RE_WHITESPACE_OR_COMMA = /[\s,]+/

/**
 * Positive depth from a `lists` or `tables` prop.
 * Returns `null` when the prop is omitted so the legacy single-child behavior stays intact.
 *
 * @param value - Raw prop value. Empty or non-positive values mean "not set".
 * @returns The depth, or `null` when the feature is off.
 */
function positiveDepth(value: number | string | undefined): number | null {
  if (value == null || value === '')
    return null
  const depth = +value
  if (Number.isNaN(depth) || depth <= 0)
    return null
  return depth
}

export default defineComponent({
  props: {
    depth: {
      type: [Number, String],
      default: 1,
    },
    /**
     * Reveal list items among other blocks, this many levels deep.
     * `1` is each top-level item. `2` also reveals nested lists.
     */
    lists: {
      type: [Number, String],
      default: undefined,
    },
    /**
     * Reveal table content among other blocks, this many levels deep.
     * `1` is each body row. `2` is each body cell.
     */
    tables: {
      type: [Number, String],
      default: undefined,
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
    /**
     * @deprecated use `animation` instead
     */
    fade: {
      type: Boolean,
      default: false,
    },
    animation: {
      type: [String, Array<string>],
      default: undefined,
    },
    handleSpecialElements: {
      type: Boolean,
      default: true,
    },
  },
  render() {
    const every = +this.every
    const at = normalizeSingleAtValue(this.at)
    const isRelative = typeof at === 'string'

    let elements = this.$slots.default?.()

    if (at == null || !elements) {
      return elements
    }

    const click = resolveDirective('click')!

    const applyDirective = (node: VNode, value: number | string) => {
      const modifiers: Record<string, boolean> = {
        hide: this.hide,
      }
      if (typeof this.animation === 'string') {
        this.animation.split(RE_WHITESPACE_OR_COMMA).forEach((a) => {
          if (a)
            modifiers[a] = true
        })
      }
      else if (Array.isArray(this.animation)) {
        this.animation.forEach(a => modifiers[a] = true)
      }
      if (this.fade)
        modifiers.fade = true

      return withDirectives(node, [
        [
          click,
          value,
          '',
          modifiers,
        ],
      ])
    }

    const openAllTopLevelSlots = <T extends VNodeArrayChildren | VNode[]>(children: T): T => {
      return children.flatMap((i) => {
        if (isVNode(i) && typeof i.type === 'symbol' && Array.isArray(i.children))
          return openAllTopLevelSlots(i.children)
        else
          return [i]
      }) as T
    }

    elements = openAllTopLevelSlots(toArray(elements))

    let globalIdx = 1
    let execIdx = 0

    const nextClickValue = () => {
      const thisShowIdx = +at + Math.ceil(globalIdx++ / every) - 1
      const delta = thisShowIdx - execIdx
      execIdx = thisShowIdx
      return isRelative
        ? delta >= 0
          ? `+${delta}`
          : `${delta}`
        : thisShowIdx
    }

    const mapSubList = (children: VNodeArrayChildren, depth: number, maxDepth: number): VNodeArrayChildren => {
      const vNodes = openAllTopLevelSlots(children).map((i) => {
        if (!isVNode(i))
          return i
        if (listTags.includes(i.type as string) && Array.isArray(i.children)) {
          // eslint-disable-next-line ts/no-use-before-define
          const vNodes = mapChildren(i.children, depth + 1, maxDepth)
          return h(i, {}, vNodes)
        }
        return h(i)
      })
      return vNodes
    }

    const componentDepth = +this.depth
    const mapChildren = (children: VNodeArrayChildren, depth = 1, maxDepth = componentDepth): VNodeArrayChildren => {
      const vNodes = openAllTopLevelSlots(children).map((i) => {
        if (!isVNode(i) || i.type === Comment)
          return i

        let vNode
        if (depth < maxDepth && Array.isArray(i.children))
          vNode = h(i, {}, mapSubList(i.children, depth, maxDepth))
        else
          vNode = h(i)

        return applyDirective(vNode, nextClickValue())
      })
      return vNodes
    }

    const expandTable = (tableNode: VNode, maxDepth: number) => {
      if (!Array.isArray(tableNode.children))
        return applyDirective(h(tableNode), nextClickValue())

      return h(tableNode, {}, tableNode.children.map((i) => {
        if (!isVNode(i))
          return i
        // Header rows stay visible. Body rows (or their cells) take the clicks.
        if (i.type === 'tbody' && Array.isArray(i.children)) {
          if (maxDepth >= 2) {
            const rows = openAllTopLevelSlots(i.children).map((row) => {
              if (!isVNode(row) || row.type !== 'tr' || !Array.isArray(row.children))
                return row
              return h(row, {}, mapChildren(row.children, 1, 1))
            })
            return h(i, {}, rows)
          }
          return h(i, {}, mapChildren(i.children, 1, 1))
        }
        return h(i)
      }))
    }

    const isBlankText = (node: VNode) =>
      node.type === Text && (typeof node.children !== 'string' || node.children.trim() === '')

    const mapMixed = (children: VNodeArrayChildren, listsDepth: number | null, tablesDepth: number | null): VNodeArrayChildren => {
      return openAllTopLevelSlots(children).map((i) => {
        if (!isVNode(i) || i.type === Comment || isBlankText(i))
          return i

        if (listsDepth != null && listTags.includes(i.type as string) && Array.isArray(i.children))
          return h(i, {}, mapChildren(i.children, 1, listsDepth))

        if (tablesDepth != null && i.type === 'table')
          return expandTable(i, tablesDepth)

        return applyDirective(h(i), nextClickValue())
      })
    }

    const lastGap = () => createVNode(VClickGap, {
      size: +at + Math.ceil((globalIdx - 1) / every) - 1 - execIdx,
    })

    if (this.handleSpecialElements) {
      const listsDepth = positiveDepth(this.lists)
      const tablesDepth = positiveDepth(this.tables)
      const only = elements.length === 1
        ? elements[0]
        : null

      // A lone list or table keeps the previous behavior unless lists/tables asks for it.
      if (only && listsDepth == null && listTags.includes(only.type as string) && Array.isArray(only.children)) {
        return h(only, {}, [
          ...mapChildren(only.children),
          lastGap(),
        ])
      }

      if (only && tablesDepth == null && only.type === 'table' && Array.isArray(only.children)) {
        return h(only, {}, only.children.map((i) => {
          if (!isVNode(i)) {
            return i
          }
          else if (i.type === 'tbody' && Array.isArray(i.children)) {
            return h(i, {}, [
              ...mapChildren(i.children),
              lastGap(),
            ])
          }
          else {
            return h(i)
          }
        }))
      }

      if (listsDepth != null || tablesDepth != null) {
        return [
          ...mapMixed(elements, listsDepth, tablesDepth),
          lastGap(),
        ]
      }
    }

    return [
      ...mapChildren(elements),
      lastGap(),
    ]
  },
})
