import type { SlidevProject } from '../projects'
import { useAbsolutePath, useControlledTerminal } from 'reactive-vscode'
import { Uri } from 'vscode'
import { getSlidesTitle } from '../utils/getSlidesTitle'

export function useServerTerminal(project: SlidevProject) {
  return useControlledTerminal({
    name: getSlidesTitle(project.data),
    cwd: project.userRoot,
    iconPath: {
      light: Uri.file(useAbsolutePath('dist/res/logo-mono.svg').value),
      dark: Uri.file(useAbsolutePath('dist/res/logo-mono-dark.svg').value),
    },
    isTransient: true,
  })
}
