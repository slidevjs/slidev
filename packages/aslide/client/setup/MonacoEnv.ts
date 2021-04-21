import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import '/@monaco-types/vue'
import '/@monaco-types/@vueuse/core'

import dark from 'theme-vitesse/themes/vitesse-dark.json'
import light from 'theme-vitesse/themes/vitesse-light.json'

light.colors['editor.background'] = '#00000000'
dark.colors['editor.background'] = '#00000000'

monaco.editor.defineTheme('vitesse-light', light as any)
monaco.editor.defineTheme('vitesse-dark', dark as any)

// @ts-expect-error
self.MonacoEnvironment = {
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

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
  noUnusedLocals: false,
  noUnusedParameters: false,
  allowUnreachableCode: true,
  allowUnusedLabels: true,
  strict: true,
})

export { monaco }
