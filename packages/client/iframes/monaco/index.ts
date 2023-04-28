import '/@slidev/styles'
import './index.css'

import type * as monaco from 'monaco-editor'
import { formatCode } from '../../setup/prettier'
import setupMonaco from '../../setup/monaco'
import '/@slidev/monaco-types'

const url = new URL(location.href)
const props = {
  id: url.searchParams.get('id'),
  code: '',
  diff: '',
  lang: url.searchParams.get('lang') ?? 'typescript',
  readonly: false,
  lineNumbers: url.searchParams.get('lineNumbers') ?? 'off',
  dark: false,
  style: '',
}

const styleObject = document.createElement('style')
let originalEditor: monaco.editor.IStandaloneCodeEditor
let modifiedEditor: monaco.editor.IStandaloneCodeEditor
let format: () => void = () => { }
let update: () => void = () => { }

document.body.appendChild(styleObject)

function lang() {
  switch (props.lang) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'jsx':
    case 'js':
      return 'javascript'
    default:
      return props.lang
  }
}

function ext() {
  switch (lang()) {
    case 'typescript':
      return 'ts'
    case 'javascript':
      return 'js'
    default:
      return lang()
  }
}

function post(data: any, type = 'slidev-monaco') {
  if (window.parent === window)
    return

  window.parent.postMessage(
    {
      type,
      id: props.id,
      data,
    },
    location.origin,
  )
}

async function start() {
  const { monaco, theme = {} } = await setupMonaco()

  const style = getComputedStyle(document.documentElement)
  const container = document.getElementById('container')!

  const model = monaco.editor.createModel(
    props.code,
    lang(),
    monaco.Uri.parse(`file:///root/${Date.now()}.${ext()}`),
  )

  if (url.searchParams.get('diff')) {
    // Diff editor
    const diffModel = monaco.editor.createModel(
      props.diff,
      lang(),
      monaco.Uri.parse(`file:///root/${Date.now()}.${ext()}`),
    )
    const monacoEditor = monaco.editor.createDiffEditor(container, {
      fontSize: +style.getPropertyValue('--slidev-code-font-size').replace(/px/g, ''),
      fontFamily: style.getPropertyValue('--slidev-code-font-family'),
      lineHeight: +style.getPropertyValue('--slidev-code-line-height').replace(/px/g, ''),
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 0,
      automaticLayout: true,
      readOnly: props.readonly,
      theme: 'vitesse-dark',
      lineNumbers: props.lineNumbers as any,
      glyphMargin: false,
      scrollbar: {
        useShadows: false,
        vertical: 'hidden',
        horizontal: 'hidden',
      },
      overviewRulerLanes: 0,
      minimap: { enabled: false },
      enableSplitViewResizing: false,
      renderOverviewRuler: false,
      // renderSideBySide: false,
    })
    monacoEditor.setModel({
      original: model,
      modified: diffModel,
    })
    originalEditor = monacoEditor.getOriginalEditor()
    modifiedEditor = monacoEditor.getModifiedEditor()

    format = async () => {
      model.setValue((await formatCode(props.code, lang())).trim())
      diffModel.setValue((await formatCode(props.diff, lang())).trim())
    }

    // ctrl+s to format
    originalEditor.onKeyDown((e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault()
        format()
      }
    })
    modifiedEditor.onKeyDown((e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault()
        format()
      }
    })

    update = () => {
      monaco.editor.setTheme(props.dark
        ? (theme.dark || 'vitesse-dark')
        : (theme.light || 'vitesse-light'),
      )
      styleObject.innerHTML = `:root { ${props.style} }`

      if (originalEditor.getValue().toString() !== props.code) {
        const selection = originalEditor.getSelection()
        originalEditor.setValue(props.code)
        if (selection)
          originalEditor.setSelection(selection)
      }

      if (modifiedEditor.getValue().toString() !== props.diff) {
        const selection = modifiedEditor.getSelection()
        modifiedEditor.setValue(props.diff)
        if (selection)
          modifiedEditor.setSelection(selection)
      }
    }

    diffModel.onDidChangeContent(() => {
      onCodeChange(diffModel.getValue().toString())
    })

    function onCodeChange(diff: string) {
      props.diff = diff
      post({ diff })
    }
  }
  else {
    // Normal editor
    originalEditor = monaco.editor.create(container, {
      model,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      folding: false,
      fontSize: +style.getPropertyValue('--slidev-code-font-size').replace(/px/g, ''),
      fontFamily: style.getPropertyValue('--slidev-code-font-family'),
      lineHeight: +style.getPropertyValue('--slidev-code-line-height').replace(/px/g, ''),
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 0,
      automaticLayout: true,
      readOnly: props.readonly,
      theme: 'vitesse-dark',
      lineNumbers: props.lineNumbers as any,
      glyphMargin: false,
      scrollbar: {
        useShadows: false,
        vertical: 'hidden',
        horizontal: 'hidden',
      },
      overviewRulerLanes: 0,
      minimap: { enabled: false },
    })

    format = async () => {
      model.setValue((await formatCode(props.code, lang())).trim())
    }

    // ctrl+s to format
    originalEditor.onKeyDown((e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault()
        format()
      }
    })

    update = () => {
      monaco.editor.setTheme(props.dark
        ? (theme.dark || 'vitesse-dark')
        : (theme.light || 'vitesse-light'),
      )
      styleObject.innerHTML = `:root { ${props.style} }`

      if (originalEditor.getValue().toString() !== props.code) {
        const selection = originalEditor.getSelection()
        originalEditor.setValue(props.code)
        if (selection)
          originalEditor.setSelection(selection)
      }
    }
  }

  originalEditor.onDidContentSizeChange(() => {
    post({ height: Math.max(originalEditor.getContentHeight(), modifiedEditor?.getContentHeight() ?? 0) })
  })

  model.onDidChangeContent(() => {
    onCodeChange(model.getValue().toString())
  })

  function onCodeChange(code: string) {
    props.code = code
    post({ code })
  }

  update()

  post({}, 'slidev-monaco-loaded')
}

window.addEventListener('message', (payload) => {
  if (payload.source === window)
    return
  if (payload.origin !== location.origin)
    return
  if (typeof payload.data !== 'string')
    return
  const { type, data, id } = JSON.parse(payload.data)
  if (type === 'slidev-monaco' && id === props.id) {
    Object.assign(props, data)
    update()
  }
})

start()
