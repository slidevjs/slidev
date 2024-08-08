import type { UseSlideInfo } from '@slidev/client/composables/useSlideInfo'
import type { SlidePatch } from '@slidev/types'
import type { MaybeRef } from '@vueuse/core'
import { computed, ref, unref } from 'vue'
import { slidesInfo, slidesSource } from '../slides'

export function useSlideInfo(no: number): UseSlideInfo {
  const info = ref({ ...slidesInfo.value[no - 1], source: {} as any })

  const update = async (data: SlidePatch) => {
    const slide = slidesSource[no - 1]
    if (data.content)
      slide.content = data.content
    if (data.note)
      slide.note = data.note
    if (data.frontmatter) {
      for (const [k, v] of Object.entries(data.frontmatter)) {
        if (v == null)
          delete slide.frontmatter[k]
        else
          slide.frontmatter[k] = v
      }
    }
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
