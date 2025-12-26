import type { EffectScope, ShallowRef } from 'reactive-vscode'
import type { Terminal } from 'vscode'
import type { SlidevProject } from '../projects'
import { basename } from 'node:path'
import { effectScope, onScopeDispose, shallowRef, useAbsoluteUri, useDisposable } from 'reactive-vscode'
import { env, window } from 'vscode'
import { config } from '../configs'
import { getSlidesTitle } from '../utils/getSlidesTitle'
import { useServerDetector } from './useServerDetector'

export interface SlidevServer {
  scope: EffectScope
  terminal: ShallowRef<Terminal | null>
  start: () => void
}

export function useDevServer(project: SlidevProject) {
  const { allocPort, redetect } = useServerDetector()

  const { port, server } = project
  if (server.value)
    return server.value

  const scope = effectScope(true)
  return server.value = scope.run(() => {
    const terminal = shallowRef<Terminal | null>(null)

    async function start() {
      if (terminal.value && terminal.value.exitStatus == null)
        return

      terminal.value = useDisposable(window.createTerminal({
        name: getSlidesTitle(project.data),
        cwd: project.userRoot,
        iconPath: {
          light: useAbsoluteUri('dist/res/logo-mono.svg').value,
          dark: useAbsoluteUri('dist/res/logo-mono-dark.svg').value,
        },
        isTransient: true,
      }))

      const p = port.value ??= await allocPort()
      const args = [
        JSON.stringify(basename(project.entry)),
        `--port ${p}`,
        env.remoteName != null ? '--remote' : '',
      ].filter(Boolean).join(' ')
      // eslint-disable-next-line no-template-curly-in-string
      terminal.value.sendText(config['dev-command'].replaceAll('${args}', args).replaceAll('${port}', `${p}`))

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
    }
  })!
}
