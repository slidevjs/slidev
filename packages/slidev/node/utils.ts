import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { ensurePrefix, slash } from '@antfu/utils'
import isInstalledGlobally from 'is-installed-globally'
import { resolvePath } from 'mlly'
import globalDirs from 'global-directory'
import type Token from 'markdown-it/lib/token'
import type { ResolvedFontOptions } from '@slidev/types'
import type { Connect } from 'vite'

const require = createRequire(import.meta.url)

export function toAtFS(path: string) {
  return `/@fs${ensurePrefix('/', slash(path))}`
}

export async function resolveImportPath(importName: string, ensure: true): Promise<string>
export async function resolveImportPath(importName: string, ensure?: boolean): Promise<string | undefined>
export async function resolveImportPath(importName: string, ensure = false) {
  try {
    return resolvePath(importName, {
      url: fileURLToPath(import.meta.url),
    })
  }
  catch {}

  if (isInstalledGlobally) {
    try {
      return require.resolve(join(globalDirs.yarn.packages, importName))
    }
    catch {}

    try {
      return require.resolve(join(globalDirs.npm.packages, importName))
    }
    catch {}
  }

  if (ensure)
    throw new Error(`Failed to resolve package "${importName}"`)

  return undefined
}

export async function resolveGlobalImportPath(importName: string): Promise<string> {
  try {
    return resolvePath(importName, {
      url: fileURLToPath(import.meta.url),
    })
  }
  catch {}

  try {
    return require.resolve(join(globalDirs.yarn.packages, importName))
  }
  catch {}

  try {
    return require.resolve(join(globalDirs.npm.packages, importName))
  }
  catch {}

  throw new Error(`Failed to resolve global package "${importName}"`)
}

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

export async function packageExists(name: string) {
  if (await resolveImportPath(`${name}/package.json`))
    return true
  return false
}

export function getBodyJson(req: Connect.IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('error', reject)
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) || {})
      }
      catch (e) {
        reject(e)
      }
    })
  })
}
