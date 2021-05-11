// @ts-ignore
import mermaid from 'mermaid/dist/mermaid.min'
import { nanoid } from 'nanoid'
import { decode } from 'js-base64'

mermaid.mermaidAPI.initialize({
  startOnLoad: false,
  theme: 'forest',
})

const cache = new Map<string, string>()

export function renderMermaid(encoded: string) {
  const _cache = cache.get(encoded)
  if (_cache)
    return _cache
  const code = decode(encoded)
  const id = nanoid()
  const svg = mermaid.render(id, code)
  cache.set(encoded, svg)
  return svg
}
