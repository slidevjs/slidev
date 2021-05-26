import { ensurePrefix, slash } from '@antfu/utils'
import { sync as resolve } from 'resolve'
import resolveGlobal from 'resolve-global'

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

  try {
    return resolveGlobal(importName)
  }
  catch {}

  if (ensure)
    throw new Error(`Failed to resolve package "${importName}"`)

  return undefined
}
