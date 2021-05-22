import type { Plugin } from 'vite'
import { getBodyJson } from './loaders'

const PREFIX = '/@server-ref/'

export interface ServerRefOptions<T extends Record<string, unknown>> {
  dataMap?: T
  debounceMs?: number
  debug?: boolean
  onChanged?: <K extends keyof T>(name: K, data: T[K], timestamp: number) => void
}

export function VitePluginServerRef(options: ServerRefOptions<any> = {}): Plugin {
  const {
    dataMap = {},
    debounceMs = 10,
    debug = true,
  } = options

  return {
    name: 'vite-plugin-server-ref',
    resolveId(id) {
      return id.startsWith(PREFIX) ? id : null
    },
    configureServer(server) {
      server.middlewares.use(async(req, res, next) => {
        if (!req.url?.startsWith(PREFIX) || req.method !== 'POST')
          return next()

        const name = req.url.slice(PREFIX.length)
        const { data, timestamp } = await getBodyJson(req)

        // TODO: handle conflicts

        const module = server.moduleGraph.getModuleById(PREFIX + name)
        if (module)
          server.moduleGraph.invalidateModule(module)

        dataMap[name] = data
        server.ws.send({
          type: 'custom',
          event: 'server-ref',
          data: {
            name,
            data,
            timestamp,
          },
        })

        options.onChanged?.(name, data, timestamp)

        res.write('')
        res.end()
      })
    },
    load(id) {
      if (!id.startsWith(PREFIX))
        return
      const name = id.slice(PREFIX.length)
      return `
import { ref, watch } from "vue"

const data = ref(${JSON.stringify(dataMap[name] ?? null)})

if (import.meta.hot) {
  ${debug ? `console.log("[server-ref] [${name}] ref", data)` : ''}
  ${debug ? `console.log("[server-ref] [${name}] initial", data.value)` : ''}

  let skipNext = false
  let timer = null
  import.meta.hot.on("server-ref", (payload) =>{
    if (payload.name !== "${name}")
      return
    skipNext = true
    data.value = payload.data
    ${debug ? `console.log("[server-ref] [${name}] incoming", payload.data)` : ''}
  })
  watch(data, (v) => {
    if (skipNext) {
      skipNext = false
      return
    }
    if (timer)
      clearTimeout(timer)

    timer = setTimeout(()=>{
      ${debug ? `console.log("[server-ref] [${name}] outgoing", data.value)` : ''}
      fetch('${PREFIX + name}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data.value,
          timestamp: Date.now(),
        })
      })
    }, ${debounceMs})
  }, { flush: 'sync', deep: true })
}

export default data
`
    },
  }
}

export default VitePluginServerRef
