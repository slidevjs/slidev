import { createVNode, defineComponent } from 'vue'
import VClicks from './VClicks'

export default defineComponent({
  render() {
    return createVNode(VClicks, { every: 99999 }, { default: this.$slots.default })
  },
})
