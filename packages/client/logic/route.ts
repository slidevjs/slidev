import { computed, nextTick, unref } from 'vue'
import { router } from '../routes'

export function useRouteQuery<T extends string | string[]>(
  name: string,
  defaultValue?: T,
  {
    mode = 'replace',
  } = {},
) {
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
        router[unref(mode) as 'replace' | 'push']({ query: { ...router.currentRoute.value.query, [name]: v } })
      })
    },
  })
}
