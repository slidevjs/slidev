import type { ClicksInfo, RawAtValue } from '@slidev/types'
import type { PropType } from 'vue'
import { injectLocal } from '@vueuse/core'
import { computed, defineComponent, onMounted, onUnmounted, shallowRef } from 'vue'
import { injectionClicksContext } from '../constants'
import { makeId } from '../logic/utils'

/**
 * Renders its slot only while its click is shown, so the content is mounted
 * on the click and unmounted when it's hidden again.
 *
 * Used by `<v-click mount>`, `<v-after mount>` and the `.mount` modifier of the click directives.
 *
 * @internal
 */
export const VClickMount = defineComponent({
  name: 'VClickMount',
  props: {
    at: {
      type: [Number, String, Array, Boolean] as PropType<RawAtValue>,
      default: '+1',
    },
    hide: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const clicks = injectLocal(injectionClicksContext, undefined)?.value
    const id = makeId()

    // `undefined` until the click is registered, `null` when there is no click to wait for
    const info = shallowRef<ClicksInfo | null | undefined>(undefined)

    // Register in `onMounted`, which runs in the same order as the `mounted` hook
    // of the `v-click` directive, so relative values (`'+1'`) resolve the same way.
    onMounted(() => {
      if (!clicks) {
        info.value = null
        return
      }
      const resolved = clicks.calculate(props.at)
      clicks.register(id, resolved)
      info.value = resolved
    })

    onUnmounted(() => {
      clicks?.unregister(id)
    })

    const isShown = computed(() => {
      const resolved = info.value
      if (resolved === undefined)
        return false
      if (resolved === null)
        return true
      return props.hide
        ? !resolved.isActive.value
        : resolved.isActive.value
    })

    return () => isShown.value
      ? slots.default?.()
      : null
  },
})
