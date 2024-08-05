import { computed, defineAsyncComponent } from 'vue'
import type { SlideRoute } from '@slidev/types'
import SlideError from '@slidev/client/layouts/error.vue'
import SlideLoading from '@slidev/client/internals/SlideLoading.vue'
import { slidesInfo } from '../slides'
import { renderNote } from '../compiler/note'
import { evalJs } from '../runtime/module'
import { compileMd } from '../compiler/md'

function getAsyncComponent(idx: number, loader: () => Promise<any>) {
  return defineAsyncComponent({
    loader,
    delay: 300,
    loadingComponent: SlideLoading,
    errorComponent: SlideError,
    onError: e => console.error(`Failed to load slide ${idx + 1}`, e),
  })
}

export const slides = computed<SlideRoute[]>(() => slidesInfo.value.map((s, i) => {
  const no = i + 1
  let loaded: any
  const loader = async () => {
    if (loaded)
      return loaded
    const { js, errors } = await compileMd(s.source.filepath, s.source.content)
    if (!js || errors?.length) {
      console.error(`Failed to compile slide ${no}`, errors)
      return SlideError
    }
    return loaded = await evalJs(js!, s.source.filepath)()
  }

  return {
    no,
    meta: {
      slide: {
        ...s,
        noteHTML: renderNote(s?.note),
        frontmatter: s.frontmatter,
        filepath: s.source.filepath,
        start: Number.NaN,
        id: i,
        no,
      },
      __clicksContext: null,
    },
    load: async () => ({ default: await loader() }),
    component: getAsyncComponent(i, loader),
  } satisfies SlideRoute
}))
