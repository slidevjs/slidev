import type { WritableComputedRef } from 'vue'
import { computed, nextTick, ref, unref } from 'vue'
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
        router[unref(mode) as 'replace' | 'push']({
          query: {
            ...router.currentRoute.value.query,
            [name]: `${v}` === defaultValue ? undefined : v,
          },
        })
      })
    },
  }) as any
}

// force update collected elements when the route is fully resolved
export const routeForceRefresh = ref(0)
