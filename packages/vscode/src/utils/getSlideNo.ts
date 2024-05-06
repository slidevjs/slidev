import type { SourceSlideInfo } from '@slidev/types'
import type { LoadedSlidevData } from '@slidev/parser/fs'

function arrayShallowEqual<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export function getSlideNo(data: LoadedSlidevData | undefined, source: SourceSlideInfo, importChain?: SourceSlideInfo[]) {
  if (!data)
    return null
  const index = data?.slides.find(s =>
    s.importChain?.includes(source)
    || (s.source === source
    && (!importChain || arrayShallowEqual(s.importChain ?? [], importChain)
    )
    ),
  )?.index
  return index ? index + 1 : null
}