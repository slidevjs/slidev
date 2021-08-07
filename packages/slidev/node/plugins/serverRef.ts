import type { Plugin } from 'vite'
import type { Ref } from 'vue'
import { getBodyJson } from './loaders'

const PREFIX = '/@server-ref/'

export interface ServerRefOptions<T extends Record<string, unknown>> {
  dataMap?: T
  debounceMs?: number
  debug?: boolean
  clientVue?: string
  onChanged?: <K extends keyof T>(name: K, data: T[K], timestamp: number, isPatch?: boolean) => void
}

export type ServerRef<T> = Ref<T> & { receive: boolean; send: boolean }

export function VitePluginServerRef(options: ServerRefOptions<any> = {}): Plugin {
  const {
    dataMap = {},
    debounceMs = 10,
    debug = true,
    clientVue = 'vue',
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
        const { data, timestamp, isPatch } = await getBodyJson(req)

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
            isPatch,
          },
        })

        options.onChanged?.(name, data, timestamp, isPatch)

        res.write('')
        res.end()
      })
    },
    load(id) {
      if (!id.startsWith(PREFIX))
        return
      const name = id.slice(PREFIX.length)
      return `
import { ref, watch } from "${clientVue}"

const data = ref(${JSON.stringify(dataMap[name] ?? null)})

data.receive = true
data.send = true
data.paused = false

if (import.meta.hot) {
  ${debug ? `console.log("[server-ref] [${name}] ref", data)` : ''}
  ${debug ? `console.log("[server-ref] [${name}] initial", data.value)` : ''}

  let skipNext = false
  let timer = null
  import.meta.hot.on("server-ref", (payload) => {
    if (!data.receive || data.paused)
      return
    if (payload.name !== "${name}")
      return
    skipNext = true
    data.value = payload.data
    ${debug ? `console.log("[server-ref] [${name}] incoming", payload.data)` : ''}
  })
  watch(data, (v) => {
    if (!data.send || data.paused)
      return
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
