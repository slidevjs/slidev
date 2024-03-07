import mermaid from 'mermaid/dist/mermaid.esm.mjs'
import lz from 'lz-string'
import { clearUndefined } from '@antfu/utils'
import setupMermaid from '../setup/mermaid'
import { makeId } from '../logic/utils'

mermaid.startOnLoad = false
mermaid.initialize({ startOnLoad: false })

const cache = new Map<string, string>()
let containerElement: Element | undefined

export async function renderMermaid(lzEncoded: string, options: any) {
  containerElement ??= document.getElementById('mermaid-rendering-container')!
  const key = lzEncoded + JSON.stringify(options)
  const _cache = cache.get(key)
  if (_cache)
    return _cache

  mermaid.initialize({
    startOnLoad: false,
    ...clearUndefined(setupMermaid() || {}),
    ...clearUndefined(options),
  })
  const code = lz.decompressFromBase64(lzEncoded)
  const id = makeId()
  const { svg } = await mermaid.render(id, code, containerElement)
  cache.set(key, svg)
  return svg
}
