import { relative } from 'node:path'
import { slash } from '@antfu/utils'
import { workspace } from 'vscode'

export function toRelativePath(path: string) {
  const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath ?? ''
  return slash(relative(workspaceRoot, path))
}
