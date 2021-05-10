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
  },
  render() {
    return createVNode(VClicks, { every: 99999, at: this.at }, { default: this.$slots.default })
  },
})
