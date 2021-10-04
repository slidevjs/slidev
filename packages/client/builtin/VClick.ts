/**
 * <v-click/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animations
 */

import { createVNode, defineComponent } from 'vue'
import VClicks from './VClicks'

export default defineComponent({
  props: {
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
    return createVNode(
      VClicks, {
        every: 99999,
        at: this.at,
        hide: this.hide,
        fade: this.fade,
      },
      { default: this.$slots.default },
    )
  },
})
