import { relative } from 'node:path'
import { slash } from '@antfu/utils'
import { workspaceRoot } from '../state'

export function toRelativePath(path: string) {
  return slash(relative(workspaceRoot, path))
}
