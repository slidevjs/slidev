import mermaidRenderers from '#slidev/setups/mermaid-renderer'
import { clearUndefined } from '@antfu/utils'
import lz from 'lz-string'
import mermaid from 'mermaid/dist/mermaid.esm.mjs'
import { makeId } from '../logic/utils'
import setupMermaid from '../setup/mermaid'

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

  const code = lz.decompressFromBase64(lzEncoded)

  // custom renderer
  for (const setup of mermaidRenderers) {
    const renderer = await setup()
    if (renderer) {
      const svg = await renderer(code, options)
      cache.set(key, svg)
      return svg
    }
  }

  // fallback: existing mermaid
  mermaid.initialize({
    startOnLoad: false,
    ...clearUndefined(await setupMermaid() || {}),
    ...clearUndefined(options),
  })
  const id = makeId()
  const { svg } = await mermaid.render(id, code, containerElement)
  cache.set(key, svg)
  return svg
}
