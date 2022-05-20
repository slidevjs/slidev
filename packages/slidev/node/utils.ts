import { join } from 'path'
import { ensurePrefix, slash } from '@antfu/utils'
import isInstalledGlobally from 'is-installed-globally'
import { sync as resolve } from 'resolve'
import globalDirs from 'global-dirs'
import type Token from 'markdown-it/lib/token'
import type { ResolvedFontOptions } from '@slidev/types'

export function toAtFS(path: string) {
  return `/@fs${ensurePrefix('/', slash(path))}`
}

export function resolveImportPath(importName: string, ensure: true): string
export function resolveImportPath(importName: string, ensure?: boolean): string | undefined
export function resolveImportPath(importName: string, ensure = false) {
  try {
    return resolve(importName, {
      preserveSymlinks: false,
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

export function resolveGlobalImportPath(importName: string): string {
  try {
    return resolve(importName, { preserveSymlinks: false, basedir: __dirname })
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
  return tokens.map(token =>
    token.children
      ?.filter(t => ['text', 'code_inline'].includes(t.type) && !t.content.match(/^\s*$/))
      .map(t => t.content.trim())
      .join(' '),
  )
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

export function packageExists(name: string) {
  if (resolveImportPath(`${name}/package.json`))
    return true
  return false
}
