/**
 * <v-click/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animation
 */

import type { RawAtValue } from '@slidev/types'
import type { PropType, VNode } from 'vue'
import { defineComponent, h, Text } from 'vue'
import { CLICKS_MAX } from '../constants'
import { VClickMount } from '../modules/v-click-mount'
import VClicks from './VClicks'

export default defineComponent({
  props: {
    at: {
      type: [Number, String, Array, Boolean] as PropType<RawAtValue>,
      default: '+1',
    },
    hide: {
      type: Boolean,
      default: false,
    },
    /**
     * Mount the content when its click is reached and unmount it when it's hidden,
     * instead of only toggling its visibility.
     */
    mount: {
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
      type: String,
      default: undefined,
    },
    wrapText: {
      type: Function as PropType<(text: VNode) => VNode>,
      default: (text: VNode) => h('span', text),
    },
  },
  render() {
    if (this.mount) {
      return h(
        VClickMount,
        {
          at: this.at,
          hide: this.hide,
        },
        {
          default: () => this.$slots.default?.(),
        },
      )
    }

    return h(
      VClicks,
      {
        every: CLICKS_MAX,
        at: this.at as string | number,
        hide: this.hide,
        fade: this.fade,
        animation: this.animation,
        handleSpecialElements: false,
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
