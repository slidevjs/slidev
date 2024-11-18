import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import fs from 'node:fs/promises'
import path from 'node:path'

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
            const filepath = path.join(userRoot, file)
            // eslint-disable-next-line no-console
            console.log('[Slidev] Writing file:', filepath)
            await fs.writeFile(filepath, content, 'utf-8')
          }
        })
      })
    },
  }
}
