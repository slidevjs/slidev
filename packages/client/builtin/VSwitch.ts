import type { VNode } from 'vue'
import { defineComponent, h, resolveDirective, withDirectives } from 'vue'
import { useSlideContext } from '../context'
import VSwitchContent from './VSwitchContent.vue'

export default defineComponent((props, { slots }) => {
  return () => {
    const { $clicksContext: clicks } = useSlideContext()
    const children: VNode[] = []

    const startAt = typeof props.at === 'number' ? props.at : clicks.currentOffset + Number(props.at)

    for (const slotKey in slots) {
      const [start, end] = parseRange(slotKey)

      children.push(h(VSwitchContent, {
        start: startAt + start - 1,
        end: startAt + end - 1,
        size: end - start + 1,
        index: slotKey,
        fade: props.fade,
      }, {
        default: slots[slotKey],
      }))
    }

    return h(
      'div',
      {
        class: 'v-switch',
      },
      children,
    )
  }
}, {
  props: {
    at: {
      type: [Number, String],
      default: '+1',
    },
    hide: {
      type: Boolean,
      default: false,
    },
    fade: {
      type: Number,
      default: 500,
    },
  },
})

function parseRange(range: string): [number, number] {
  if (!Number.isNaN(Number(range)))
    return [Number(range), Number(range)]
  return range.split('-').map(i => Number.parseInt(i)) as [number, number]
}
