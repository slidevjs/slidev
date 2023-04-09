import mermaid from 'mermaid/dist/mermaid.esm.mjs'
import { customAlphabet } from 'nanoid'
import { decode } from 'js-base64'
import { clearUndefined } from '@antfu/utils'
import setupMermaid from '../setup/mermaid'

mermaid.startOnLoad = false
mermaid.initialize({ startOnLoad: false })

const nanoid = customAlphabet('abcedfghicklmn', 10)
const cache = new Map<string, string>()

export async function renderMermaid(encoded: string, options: any) {
  const key = encoded + JSON.stringify(options)
  const _cache = cache.get(key)
  if (_cache)
    return _cache

  mermaid.initialize({
    startOnLoad: false,
    ...clearUndefined(setupMermaid() || {}),
    ...clearUndefined(options),
  })
  const code = decode(encoded)
  const id = nanoid()
  const { svg } = await mermaid.render(id, code)
  cache.set(key, svg)
  return svg
}
