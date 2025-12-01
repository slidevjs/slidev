import type { EffectScope, Ref } from 'reactive-vscode'
import type { Terminal } from 'vscode'
import type { SlidevProject } from '../projects'
import { basename } from 'node:path'
import { effectScope, onScopeDispose, useAbsolutePath, useControlledTerminal } from 'reactive-vscode'
import { env, Uri } from 'vscode'
import { devCommand } from '../configs'
import { getSlidesTitle } from '../utils/getSlidesTitle'
import { useServerDetector } from './useServerDetector'

export interface SlidevServer {
  scope: EffectScope
  terminal: Ref<Terminal | null>
  start: () => void
  showTerminal: () => void
}

export function useDevServer(project: SlidevProject) {
  const { allocPort, redetect } = useServerDetector()

  const { port, server } = project
  if (server.value)
    return server.value

  const scope = effectScope(true)
  return server.value = scope.run(() => {
    const { terminal, getIsActive, show: showTerminal, sendText, close } = useControlledTerminal({
      name: getSlidesTitle(project.data),
      cwd: project.userRoot,
      iconPath: {
        light: Uri.file(useAbsolutePath('dist/res/logo-mono.svg').value),
        dark: Uri.file(useAbsolutePath('dist/res/logo-mono-dark.svg').value),
      },
      isTransient: true,
    })

    async function start() {
      if (getIsActive())
        return
      const p = port.value ??= await allocPort()
      const args = [
        JSON.stringify(basename(project.entry)),
        `--port ${p}`,
        env.remoteName != null ? '--remote' : '',
      ].filter(Boolean).join(' ')
      // eslint-disable-next-line no-template-curly-in-string
      sendText(devCommand.value.replaceAll('${args}', args).replaceAll('${port}', `${p}`))

      let intervalCount = 0
      const maxIntervals = 100
      const interval = setInterval(async () => {
        intervalCount++
        const ready = await redetect(p)
        if (ready || intervalCount >= maxIntervals) {
          clearInterval(interval)
        }
      }, 500)
    }

    onScopeDispose(() => {
      close()
      server.value = null
    })

    return {
      scope,
      terminal,
      start,
      showTerminal,
    }
  })!
}
