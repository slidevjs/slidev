import { createSingletonPromise } from '@antfu/utils'
import type { MonacoSetupReturn } from '@slidev/types'
import * as monaco from 'monaco-editor'
import { watchEffect } from 'vue'
import { setupTypeAcquisition } from '@typescript/ata'
import ts from 'typescript'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// @ts-expect-error missing types
import { ContextViewService } from 'monaco-editor/esm/vs/platform/contextview/browser/contextViewService'

// @ts-expect-error missing types
import { SyncDescriptor } from 'monaco-editor/esm/vs/platform/instantiation/common/descriptors'

// @ts-expect-error missing types
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices'

import { isDark } from '../logic/dark'
import configs from '#slidev/configs'
import setups from '#slidev/setups/monaco'

window.MonacoEnvironment = {
  getWorker(_, label) {
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

class ContextViewService2 extends ContextViewService {
  showContextView(...args: any) {
    super.showContextView(...args)
    // @ts-expect-error missing types
    const contextView = this.contextView.view as HTMLElement
    contextView.style.left = `calc(${contextView.style.left} / var(--slidev-slide-scale))`
    contextView.style.top = `calc(${contextView.style.top} / var(--slidev-slide-scale))`
    // Reset the scale to 1. Otherwise, the sub-menu will be in the wrong position.
    contextView.style.transform = `scale(calc(1 / var(--slidev-slide-scale)))`
    contextView.style.transformOrigin = '0 0'
  }
}

const setup = createSingletonPromise(async () => {
  // Initialize services first, otherwise we can't override them.
  StandaloneServices.initialize({
    contextViewService: new SyncDescriptor(ContextViewService2, [], true),
  })

  const defaults = monaco.languages.typescript.typescriptDefaults

  defaults.setCompilerOptions({
    ...defaults.getCompilerOptions(),
    strict: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
  })

  // Load types from server
  import('#slidev/monaco-types')

  const ata = configs.monacoTypesSource === 'cdn'
    ? setupTypeAcquisition({
      projectName: 'TypeScript Playground',
      typescript: ts as any, // Version mismatch. No problem found so far.
      logger: console,
      delegate: {
        receivedFile: (code: string, path: string) => {
          defaults.addExtraLib(code, `file://${path}`)
          const uri = monaco.Uri.file(path)
          if (monaco.editor.getModel(uri) === null)
            monaco.editor.createModel(code, 'javascript', uri)
        },
        progress: (downloaded: number, total: number) => {
          // eslint-disable-next-line no-console
          console.debug(`[Typescript ATA] ${downloaded} / ${total}`)
        },
      },
    })
    : () => { }

  monaco.languages.register({ id: 'vue' })
  monaco.languages.register({ id: 'html' })
  monaco.languages.register({ id: 'css' })
  monaco.languages.register({ id: 'typescript' })
  monaco.languages.register({ id: 'javascript' })

  const { shiki, themes, shikiToMonaco } = await import('#slidev/shiki')
  const highlighter = await shiki

  const setupReturn: MonacoSetupReturn = {}
  for (const setup of setups) {
    const result = await setup(monaco)
    Object.assign(setupReturn, result)
  }

  // Use Shiki to highlight Monaco
  shikiToMonaco(highlighter, monaco)
  if (typeof themes === 'string') {
    monaco.editor.setTheme(themes)
  }
  else {
    watchEffect(() => {
      monaco.editor.setTheme(isDark.value
        ? themes.dark || 'vitesse-dark'
        : themes.light || 'vitesse-light')
    })
  }

  return {
    monaco,
    ata,
    ...setupReturn,
  }
})

export async function addFile(raw: Promise<{ default: string }>, path: string) {
  const code = (await raw).default
  monaco.languages.typescript.typescriptDefaults.addExtraLib(code, `file:///${path}`)
  monaco.editor.createModel(code, 'javascript', monaco.Uri.file(path))
}

export default setup
