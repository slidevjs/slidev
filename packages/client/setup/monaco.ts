import { createSingletonPromise } from '@antfu/utils'
import { shikiToMonaco } from '@shikijs/monaco'
import type { MonacoSetupReturn } from '@slidev/types'
import * as monaco from 'monaco-editor'
import { getHighlighter } from 'shiki'
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

/* __imports__ */

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
    const container: HTMLElement = this.layoutService.getContainer()
    const contextView = container.querySelector('.monaco-editor .shadow-root-host')!.shadowRoot!.childNodes[1] as HTMLElement
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

  const ata = setupTypeAcquisition({
    projectName: 'TypeScript Playground',
    typescript: ts as any, // Version mismatch. No problem found so far.
    logger: console,
    delegate: {
      receivedFile: (code: string, path: string) => {
        defaults.addExtraLib(code, `file://${path}`)
      },
      progress: (downloaded: number, total: number) => {
        // eslint-disable-next-line no-console
        console.debug(`[Typescript ATA] ${downloaded} / ${total}`)
      },
    },
  })

  // monaco.languages.register({ id: 'vue' })
  monaco.languages.register({ id: 'typescript' })
  monaco.languages.register({ id: 'javascript' })

  const highlighter = await getHighlighter({
    themes: [
      // TODO: pass theme names from server
      'vitesse-dark',
      'vitesse-light',
    ],
    langs: [
      'javascript',
      'typescript',
      // 'vue',
    ],
  })
  shikiToMonaco(highlighter, monaco)

  watchEffect(() => {
    monaco.editor.setTheme(isDark.value ? 'vitesse-dark' : 'vitesse-light')
  })

  // @ts-expect-error injected in runtime
  // eslint-disable-next-line unused-imports/no-unused-vars
  const injection_arg = monaco
  // eslint-disable-next-line prefer-const
  let injection_return: MonacoSetupReturn = {}

  /* __async_injections__ */

  return {
    monaco,
    ata,
    ...injection_return,
  }
})

export default setup
