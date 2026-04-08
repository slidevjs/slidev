import { defineCodeblockTransformer } from '@slidev/types'
import lz from 'lz-string'

const RE_MERMAID = /^mermaid\s*(\{[^\n]*\})?/

export default defineCodeblockTransformer(async ({ info, code }) => {
  const match = info.match(RE_MERMAID)
  if (!match)
    return
  const [, options] = match
  const optionsProp = options ? `v-bind="${options}"` : ''
  const encoded = lz.compressToBase64(code.trim())
  return `<Mermaid ${optionsProp} code-lz="${encoded}" />`
})
