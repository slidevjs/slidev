import { MaybeRef, useFetch } from '@vueuse/core'
import { computed, ref, Ref, unref } from 'vue'
import type { SlideInfo, SlideInfoExtended } from '@slidev/types'

export interface UseSlideInfo{
  info: Ref<SlideInfoExtended | undefined>
  update: (data: Partial<SlideInfo>) => Promise<void>
}

export function useSlideInfo(id: number | undefined): UseSlideInfo {
  if (id == null) {
    return {
      info: ref() as Ref<SlideInfoExtended | undefined>,
      update: async() => {},
    }
  }
  const url = `/@slidev/slide/${id}.json`
  const { data: info, execute } = useFetch(url).json().get()

  execute()

  const update = async(data: Partial<SlideInfo>) => {
    await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
  }

  import.meta.hot?.on('slidev-update', (playload) => {
    if (playload.id === id)
      info.value = playload.data
  })

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
    update: (data: Partial<SlideInfo>, newId?: number) => get(newId ?? unref(id)).update(data),
  }
}
