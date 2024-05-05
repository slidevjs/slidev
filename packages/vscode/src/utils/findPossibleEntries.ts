import { basename } from 'node:path'
import { slash } from '@antfu/utils'
import { workspace } from 'vscode'

export async function findPossibleEntries() {
  const files = await workspace.findFiles('**/*.md', '**/{node_modules,.github}/**')
  return files
    .map(uri => slash(uri.fsPath))
    .filter(path => ![
      'readme.md',
      'code_of_conduct.md',
      'contributing.md',
      'license.md',
      'licence.md',
    ].includes(basename(path).toLocaleLowerCase()))
}
