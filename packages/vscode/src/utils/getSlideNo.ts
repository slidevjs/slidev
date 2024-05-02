import type { SourceSlideInfo } from '@slidev/types'
import { activeSlidevData } from '../state'

function arrayShallowEqual<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export function getSlideNo(source: SourceSlideInfo, importChain?: SourceSlideInfo[]) {
  const data = activeSlidevData.value
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
