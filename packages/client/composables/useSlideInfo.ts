import type { SlideInfo, SlidePatch } from '@slidev/types'
import type { MaybeRef } from '@vueuse/core'
import type { Ref } from 'vue'
import { useFetch } from '@vueuse/core'
import { computed, ref, unref } from 'vue'
import { getSlide } from '../logic/slides'

export interface UseSlideInfo {
  info: Ref<SlideInfo | null>
  update: (data: SlidePatch) => Promise<SlideInfo | void>
}

export function useSlideInfo(no: number): UseSlideInfo {
  if (!__SLIDEV_HAS_SERVER__) {
    return {
      info: ref(getSlide(no)?.meta.slide ?? null) as Ref<SlideInfo | null>,
      update: async () => {},
    }
  }
  const url = `/__slidev/slides/${no}.json`
  const { data: info, execute } = useFetch(url).json<SlideInfo>().get()

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
    import.meta.hot?.on('slidev:update-slide', (payload) => {
      if (payload.no === no)
        info.value = payload.data
    })
    import.meta.hot?.on('slidev:update-note', (payload) => {
      if (payload.no === no && info.value && info.value.note?.trim() !== payload.note?.trim())
        info.value = { ...info.value, ...payload }
    })
  }

  return {
    info,
    update,
  }
}

const map: Record<number, UseSlideInfo> = {}

export function useDynamicSlideInfo(no: MaybeRef<number>) {
  function get(no: number) {
    return map[no] ??= useSlideInfo(no)
  }

  return {
    info: computed({
      get() {
        return get(unref(no)).info.value
      },
      set(newInfo) {
        get(unref(no)).info.value = newInfo
      },
    }),
    update: async (data: SlidePatch, newId?: number) => {
      const info = get(newId ?? unref(no))
      const newData = await info.update(data)
      if (newData)
        info.info.value = newData
      return newData
    },
  }
}
