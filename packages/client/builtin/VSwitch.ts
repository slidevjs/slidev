import type { PropType, Ref, Slot, TransitionGroupProps, VNode } from 'vue'
import { recomputeAllPoppers } from 'floating-vue'
import { defineComponent, h, onMounted, onUnmounted, ref, TransitionGroup, watchEffect } from 'vue'
import { CLASS_VCLICK_CURRENT, CLASS_VCLICK_DISPLAY_NONE, CLASS_VCLICK_PRIOR, CLASS_VCLICK_TARGET, CLICKS_MAX } from '../constants'
import { useSlideContext } from '../context'
import { resolveTransition } from '../logic/transition'
import { makeId } from '../logic/utils'
import { hmrSkipTransition } from '../state'

export default defineComponent({
  props: {
    at: {
      type: [Number, String],
      default: '+1',
    },
    /**
     * unmount or hide the content when it's not visible
     */
    unmount: {
      type: Boolean,
      default: false,
    },
    transition: {
      type: [Object, String, Boolean] as PropType<TransitionGroupProps | string | false>,
      default: false,
    },
    tag: {
      type: String,
      default: 'div',
    },
    childTag: {
      type: String,
      default: 'div',
    },
  },
  setup({ at, unmount, transition, tag, childTag }, { slots }) {
    const slotEntries = Object.entries(slots).sort((a, b) => -a[0].split('-')[0] + +b[0].split('-')[0])
    const contents: [start: number, end: number, slot: Slot<any> | undefined, elRef: Ref<HTMLElement | undefined>][] = []

    let lastStart: number | undefined
    for (const [range, slot] of slotEntries) {
      const elRef = ref<HTMLElement>()
      if (Number.isFinite(+range)) {
        contents.push([+range, lastStart ?? +range + 1, slot, elRef])
        lastStart = +range
      }
      else {
        const [start, end] = range.split('-').map(Number)
        if (!Number.isFinite(start) || !Number.isFinite(end))
          throw new Error(`Invalid range for v-switch: ${range}`)
        contents.push([start, end, slot, elRef])
        lastStart = start
      }
    }

    const size = Math.max(...contents.map(c => c[1])) - 1
    const id = makeId()
    const offset = ref(0)

    const { $clicksContext: clicks, $nav: nav } = useSlideContext()

    onMounted(() => {
      const clicksInfo = clicks.calculateSince(at, size)
      if (!clicksInfo) {
        offset.value = CLICKS_MAX
        return
      }
      clicks.register(id, clicksInfo)
      watchEffect(() => {
        offset.value = clicksInfo.currentOffset.value + 1
      })
    })

    onUnmounted(() => {
      clicks.unregister(id)
    })

    function onAfterLeave() {
      // Refer to SlidesShow.vue
      hmrSkipTransition.value = true
      recomputeAllPoppers()
    }
    const transitionProps = transition && {
      ...resolveTransition(transition, nav.value.navDirection < 0),
      tag,
      onAfterLeave,
    }

    return () => {
      const children: VNode[] = []
      for (let i = contents.length - 1; i >= 0; i--) {
        const [start, end, slot, ref] = contents[i]
        const visible = start <= offset.value && offset.value < end
        if (unmount && !visible)
          continue
        children.push(h(childTag, {
          'key': i,
          ref,
          'class': [
            CLASS_VCLICK_TARGET,
            offset.value === start && CLASS_VCLICK_CURRENT,
            offset.value >= end && CLASS_VCLICK_PRIOR,
            !visible && CLASS_VCLICK_DISPLAY_NONE,
          ].filter(Boolean),
          'data-slidev-clicks-start': start,
          'data-slidev-clicks-end': end,
        }, slot?.()))
      }
      return transitionProps
        ? h(TransitionGroup, hmrSkipTransition.value ? {} : transitionProps, () => children)
        : h(tag, children)
    }
  },
})
