import { getCurrentInstance, onMounted } from 'vue'
import * as monaco from 'monaco-editor'
import { createSingletonPromise } from '@antfu/utils'
import type { MonacoSetupReturn } from '@slidev/types'

/* __imports__ */

const setup = createSingletonPromise(async () => {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
    noUnusedLocals: false,
    noUnusedParameters: false,
    allowUnreachableCode: true,
    allowUnusedLabels: true,
    strict: true,
  })

  await Promise.all([
    // load workers
    (async () => {
      const [
        { default: EditorWorker },
        { default: JsonWorker },
        { default: CssWorker },
        { default: HtmlWorker },
        { default: TsWorker },
      ] = await Promise.all([
        import('monaco-editor/esm/vs/editor/editor.worker?worker'),
        import('monaco-editor/esm/vs/language/json/json.worker?worker'),
        import('monaco-editor/esm/vs/language/css/css.worker?worker'),
        import('monaco-editor/esm/vs/language/html/html.worker?worker'),
        import('monaco-editor/esm/vs/language/typescript/ts.worker?worker'),
      ])

      window.MonacoEnvironment = {
        getWorker(_: any, label: string) {
          if (label === 'json')
            return new JsonWorker()
          if (label === 'css' || label === 'scss' || label === 'less')
            return new CssWorker()
          if (label === 'html' || label === 'handlebars' || label === 'razor')
            return new HtmlWorker()
          if (label === 'typescript' || label === 'javascript')
            return new TsWorker()
          return new EditorWorker()
        },
      }
    })(),
  ])

  // @ts-expect-error injected in runtime
  // eslint-disable-next-line unused-imports/no-unused-vars
  const injection_arg = monaco
  // eslint-disable-next-line prefer-const
  let injection_return: MonacoSetupReturn = {}

  /* __async_injections__ */

  if (getCurrentInstance())
    await new Promise<void>(resolve => onMounted(resolve))

  return {
    monaco,
    ...injection_return,
  }
})

export default setup

setup()
