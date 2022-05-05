import type { MaybeRef } from '@vueuse/core'
import { useFetch } from '@vueuse/core'
import type { Ref } from 'vue'
import { computed, ref, unref } from 'vue'
import type { SlideInfo, SlideInfoExtended } from '@slidev/types'

export interface UseSlideInfo {
  info: Ref<SlideInfoExtended | undefined>
  update: (data: Partial<SlideInfo>) => Promise<SlideInfoExtended | void>
}

export function useSlideInfo(id: number | undefined): UseSlideInfo {
  if (id == null) {
    return {
      info: ref() as Ref<SlideInfoExtended | undefined>,
      update: async () => {},
    }
  }
  const url = `/@slidev/slide/${id}.json`
  const { data: info, execute } = useFetch(url).json().get()

  execute()

  const update = async (data: Partial<SlideInfo>) => {
    return await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    ).then(r => r.json())
  }

  if (__DEV__) {
    import.meta.hot?.on('slidev-update', (payload) => {
      if (payload.id === id)
        info.value = payload.data
    })
  }

  return {
    info,
    update,
  }
}

const map: Record<string, UseSlideInfo> = {}

export function useDynamicSlideInfo(id: MaybeRef<number | undefined>) {
  function get(id: number | undefined) {
    const i = `${id}`
    if (!map[i])
      map[i] = useSlideInfo(id)
    return map[i]
  }

  return {
    info: computed(() => get(unref(id)).info.value),
    update: async (data: Partial<SlideInfo>, newId?: number) => {
      const info = get(newId ?? unref(id))
      const newData = await info.update(data)
      if (newData)
        info.info.value = newData
      return newData
    },
  }
}
