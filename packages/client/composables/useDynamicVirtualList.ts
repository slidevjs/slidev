import type { UseVirtualListOptions } from '@vueuse/core'
import { debouncedWatch, useVirtualList } from '@vueuse/core'
import type { MaybeRef } from 'vue'
import { effectScope, shallowRef } from 'vue'

/**
 * `useVirtualList`'s `itemHeight` is not reactive, so we need to re-create the virtual list when the card height changes.
 */
export function useDynamicVirtualList<T>(list: MaybeRef<T[]>, getOptions: () => UseVirtualListOptions) {
  type VirtualListReturn = ReturnType<typeof useVirtualList<T>>
  const virtualList = shallowRef<VirtualListReturn>()
  debouncedWatch(
    getOptions,
    (options, _oldOptions, onCleanup) => {
      const scope = effectScope()
      scope.run(() => {
        virtualList.value = useVirtualList(
          list,
          options,
        )
      })
      onCleanup(() => scope.stop())
    },
    {
      immediate: true,
      debounce: 50,
    },
  )
  return virtualList
}
