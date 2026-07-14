import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import fs from 'node:fs/promises'
import path from 'pathe'

export const monacoWriterWhitelist = new Set<string>()

export function createMonacoWriterPlugin({ userRoot }: ResolvedSlidevOptions): Plugin {
  return {
    name: 'slidev:monaco-write',
    apply: 'serve',

    configureServer(server) {
      server.ws.on('connection', (socket) => {
        socket.on('message', async (data) => {
          let json
          try {
            json = JSON.parse(data.toString())
          }
          catch {
            return
          }
          if (json.type === 'custom' && json.event === 'slidev:monaco-write') {
            const { file, content } = json.data
            if (!monacoWriterWhitelist.has(file)) {
              console.error(`[Slidev] Unauthorized file write: ${file}`)
              return
            }
            const filepath = path.resolve(userRoot, file)
            const rel = path.relative(userRoot, filepath)
            if (rel.startsWith('..') || path.isAbsolute(rel)) {
              console.error(`[slidev] Refusing monaco write outside project root: ${file}`)
              return
            }
            // eslint-disable-next-line no-console
            console.log('[Slidev] Writing file:', filepath)
            await fs.writeFile(filepath, content, 'utf-8')
          }
        })
      })
    },
  }
}
