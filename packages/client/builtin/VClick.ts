import { createVNode, defineComponent } from 'vue'
import VClicks from './VClicks'

export default defineComponent({
  props: {
    at: {
      type: [Number, String],
    },
  },
  render() {
    return createVNode(VClicks, { every: 99999, at: this.at }, { default: this.$slots.default })
  },
})
