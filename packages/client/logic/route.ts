import type { WritableComputedRef } from 'vue'
import { computed, nextTick, unref } from 'vue'
import { useRouter } from 'vue-router'

export function useRouteQuery<T extends string | string[]>(
  name: string,
  defaultValue?: T,
  {
    mode = 'replace',
  } = {},
): WritableComputedRef<T> {
  const router = useRouter()

  return computed<any>({
    get() {
      const data = router.currentRoute.value.query[name]
      if (data == null)
        return defaultValue ?? null
      if (Array.isArray(data))
        return data.filter(Boolean)
      return data
    },
    set(v) {
      nextTick(() => {
        const oldValue = router.currentRoute.value.query[name]
        if ((oldValue ?? defaultValue?.toString()) === v.toString())
          return
        router[unref(mode) as 'replace' | 'push']({
          query: {
            ...router.currentRoute.value.query,
            [name]: `${v}` === defaultValue ? undefined : v,
          },
        })
      })
    },
  })
}
