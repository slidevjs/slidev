import { ensurePrefix, slash } from '@antfu/utils'

export function toAtFS(path: string) {
  return `/@fs${ensurePrefix('/', slash(path))}`
}
