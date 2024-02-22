import * as vm from 'node:vm'
import type { Plugin } from 'vite'
import type { RunResult } from '@slidev/types'
import ts from 'typescript'
import { resolvePath } from 'mlly'
import isPathInside from 'is-path-inside'
import { getBodyJson } from '../utils'
import type { ResolvedSlidevOptions } from '../options'

async function runJavaScript(src: string, options: ResolvedSlidevOptions) {
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
          context.console.error('Assertion failed:', ...args)
      },
      clear: () => {
        result.output = []
      },
    },
  }

  try {
    await vm.runInNewContext(`async (_import) => {
      ${src}
    }`, context)(async (id: string, importOptions: ImportCallOptions) => {
      const isFile = id.startsWith('file:') || id.startsWith('/') || id.startsWith('.')
      if (isFile && !isPathInside(id, options.userRoot))
        throw new Error(`Importing file outside of the project directory is not allowed: ${id}`)
      return await import(`file:///${await resolvePath(id, { url: options.entry })}`, importOptions)
    })
  }
  catch (e) {
    result.output.push({ type: 'error', text: String(e) })
  }

  return result
}

function runTypeScript(src: string, options: ResolvedSlidevOptions) {
  if (src.trim() === '')
    return Promise.resolve({ type: 'success', output: [] } as RunResult)

  return runJavaScript(ts.transpile(src), options)
}

const runners: Record<string, (src: string, options: ResolvedSlidevOptions) => Promise<RunResult>> = {
  js: runJavaScript,
  javascript: runJavaScript,
  ts: runTypeScript,
  typescript: runTypeScript,
}

export function createMonacoRunnable(options: ResolvedSlidevOptions): Plugin {
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
            ? await runner(src, options)
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
