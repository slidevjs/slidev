import { relative } from 'node:path'
import { slash } from '@antfu/utils'
import { workspace } from 'vscode'

const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath ?? ''

export function toRelativePath(path: string) {
  return slash(relative(workspaceRoot, path))
}
