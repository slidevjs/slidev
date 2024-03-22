import type { MaybeRef } from '@vueuse/core'
import { useFetch } from '@vueuse/core'
import type { Ref } from 'vue'
import { computed, ref, unref } from 'vue'
import type { SlideInfo, SlidePatch } from '@slidev/types'
import { getSlide } from '../logic/slides'

export interface UseSlideInfo {
  info: Ref<SlideInfo | undefined>
  update: (data: SlidePatch) => Promise<SlideInfo | void>
}

export function useSlideInfo(no: number): UseSlideInfo {
  if (!__SLIDEV_HAS_SERVER__) {
    return {
      info: ref(getSlide(no)?.meta.slide) as Ref<SlideInfo | undefined>,
      update: async () => {},
    }
  }
  const url = `/@slidev/slide/${no}.json`
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
    import.meta.hot?.on('slidev:update-slide', (payload) => {
      if (payload.no === no)
        info.value = payload.data
    })
    import.meta.hot?.on('slidev:update-note', (payload) => {
      if (payload.no === no && info.value.note?.trim() !== payload.note?.trim())
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
    info: computed(() => get(unref(no)).info.value),
    update: async (data: SlidePatch, newId?: number) => {
      const info = get(newId ?? unref(no))
      const newData = await info.update(data)
      if (newData)
        info.info.value = newData
      return newData
    },
  }
}
