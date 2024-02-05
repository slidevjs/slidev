import * as vm from 'node:vm'
import type { Plugin } from 'vite'
import type { RunResult } from '@slidev/types'
import ts from 'typescript'
import { getBodyJson } from '../utils'

async function runJavaScript(src: string) {
  const result: RunResult = {
    type: 'success',
    output: [],
  }

  const createOutputFunc = (type: 'debug' | 'info' | 'warn' | 'error') => {
    return (...args: any[]) => {
      result.output.push({ type, text: args.join(' ') })
    }
  }

  const context = {
    console: {
      debug: createOutputFunc('debug'),
      info: createOutputFunc('info'),
      warn: createOutputFunc('warn'),
      error: createOutputFunc('error'),
      log: createOutputFunc('info'),
      assert: (condition: any, ...args: any[]) => {
        if (!condition)
          createOutputFunc('error')('Assertion failed:', ...args)
      },
      clear: () => {
        result.output = []
      },
    },
  }

  try {
    vm.createContext(context)
    vm.runInContext(src, context)
  }
  catch (e) {
    result.output.push({ type: 'error', text: String(e) })
  }

  return result
}

function runTypeScript(src: string) {
  return runJavaScript(ts.transpile(src))
}

const runners: Record<string, (src: string) => Promise<RunResult>> = {
  js: runJavaScript,
  javascript: runJavaScript,
  ts: runTypeScript,
  typescript: runTypeScript,
}

export function createMonacoRunnable(): Plugin {
  return {
    name: 'slidev:monaco-runnable',

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__run_code?') || req.method !== 'POST')
          return next()
        const lang = new URLSearchParams(req.url.split('?')[1]).get('lang')!
        const src: string = await getBodyJson(req)

        let result: RunResult

        try {
          const runner = runners[lang]
          result = runner
            ? await runner(src)
            : { type: 'error', message: `Language "${lang}" is not supported` }
        }
        catch (e: any) {
          result = { type: 'error', message: String(e) }
        }

        res.statusCode = 200
        res.write(JSON.stringify(result))
        return res.end()
      })
    },
  }
}
