import type Token from 'markdown-it/lib/token'
import type { ResolvedFontOptions } from '@slidev/types'
import { satisfies } from 'semver'
import { version } from '../package.json'

export function stringifyMarkdownTokens(tokens: Token[]) {
  return tokens.map(token => token.children
    ?.filter(t => ['text', 'code_inline'].includes(t.type) && !t.content.match(/^\s*$/))
    .map(t => t.content.trim())
    .join(' '))
    .filter(Boolean)
    .join(' ')
}

export function generateGoogleFontsUrl(options: ResolvedFontOptions) {
  const weights = options.weights
    .flatMap(i => options.italic ? [`0,${i}`, `1,${i}`] : [`${i}`])
    .sort()
    .join(';')
  const fonts = options.webfonts
    .map(i => `family=${i.replace(/^(['"])(.*)\1$/, '$1').replace(/\s+/g, '+')}:${options.italic ? 'ital,' : ''}wght@${weights}`)
    .join('&')

  return `https://fonts.googleapis.com/css2?${fonts}&display=swap`
}

export function checkEngine(name: string, engines: { slidev?: string } = {}) {
  if (engines.slidev && !satisfies(version, engines.slidev, { includePrerelease: true }))
    throw new Error(`[slidev] addon "${name}" requires Slidev version range "${engines.slidev}" but found "${version}"`)
}

export function makeId(length = 5) {
  const result = []
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++)
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)))
  return result.join('')
}
