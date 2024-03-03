/**
 * <v-click/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animations
 */

import type { PropType, VNode } from 'vue'
import { Text, defineComponent, h } from 'vue'
import { CLICKS_MAX } from '../constants'
import VClicks from './VClicks'

export default defineComponent({
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
      type: Boolean,
      default: false,
    },
    wrapText: {
      type: Function as PropType<(text: VNode) => VNode>,
      default: (text: VNode) => h('span', text),
    },
  },
  render() {
    return h(
      VClicks,
      {
        every: CLICKS_MAX,
        at: this.at,
        hide: this.hide,
        fade: this.fade,
      },
      {
        default: () =>
          this.$slots.default?.().map(v =>
            v.type === Text
              ? this.wrapText(v)
              : v,
          ),
      },
    )
  },
})
