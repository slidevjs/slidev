// @ts-ignore
import mermaid from 'mermaid/dist/mermaid.min'
import { customAlphabet } from 'nanoid'
import { decode } from 'js-base64'

mermaid.startOnLoad = false
mermaid.initialize({ startOnLoad: false })

const nanoid = customAlphabet('abcedfghicklmn', 10)
const cache = new Map<string, string>()

export function renderMermaid(encoded: string, options: any) {
  const _cache = cache.get(encoded)
  if (_cache)
    return _cache

  mermaid.initialize({
    startOnLoad: false,
    theme: 'forest',
    ...options,
  })
  const code = decode(encoded)
  const id = nanoid()
  const svg = mermaid.render(id, code)
  cache.set(encoded, svg)
  return svg
}
