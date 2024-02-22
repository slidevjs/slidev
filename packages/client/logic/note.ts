import type { MaybeRef } from '@vueuse/core'
import { useFetch } from '@vueuse/core'
import type { Ref } from 'vue'
import { computed, ref, unref } from 'vue'
import type { SlideInfo, SlidePatch } from '@slidev/types'

export interface UseSlideInfo {
  info: Ref<SlideInfo | undefined>
  update: (data: SlidePatch) => Promise<SlideInfo | void>
}

export function useSlideInfo(id: number | undefined): UseSlideInfo {
  if (id == null) {
    return {
      info: ref() as Ref<SlideInfo | undefined>,
      update: async () => {},
    }
  }
  const url = `/@slidev/slide/${id}.json`
  const { data: info, execute } = useFetch(url).json().get()

  execute()

  const update = async (data: SlidePatch) => {
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
    import.meta.hot?.on('slidev-update-note', (payload) => {
      if (payload.id === id && info.value.note?.trim() !== payload.note?.trim())
        info.value = { ...info.value, ...payload }
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
    update: async (data: SlidePatch, newId?: number) => {
      const info = get(newId ?? unref(id))
      const newData = await info.update(data)
      if (newData)
        info.info.value = newData
      return newData
    },
  }
}
