import { ensurePrefix, slash } from '@antfu/utils'
import { sync } from 'resolve'

export function toAtFS(path: string) {
  return `/@fs${ensurePrefix('/', slash(path))}`
}

export function resolveImportPath(importName: string) {
  return sync(importName, {
    preserveSymlinks: false,
  })
}
