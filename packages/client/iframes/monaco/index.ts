import '/@slidev/styles'
import './index.css'

import type * as monaco from 'monaco-editor'
import { formatCode } from '../../setup/prettier'
import setupMonaco from '../../setup/monaco'
import '/@slidev/monaco-types'

const props = {
  id: Math.random().toString(),
  code: '',
  lang: 'typescript',
  readonly: false,
  lineNumbers: 'off',
  dark: false,
  style: '',
}

const styleObject = document.createElement('style')
let editor: monaco.editor.IStandaloneCodeEditor
let update: () => void = () => {}

document.body.appendChild(styleObject)

const lang = () => {
  switch (props.lang) {
    case 'ts':
      return 'typescript'
    case 'js':
      return 'javascript'
    default:
      return props.lang
  }
}

const ext = () => {
  switch (lang()) {
    case 'typescript':
      return 'ts'
    case 'javascript':
      return 'js'
    default:
      return lang()
  }
}

async function start() {
  const { monaco, theme = {} } = await setupMonaco()

  const model = monaco.editor.createModel(
    props.code,
    lang(),
    monaco.Uri.parse(`file:///root/${Date.now()}.${ext()}`),
  )

  const style = getComputedStyle(document.documentElement)
  const container = document.getElementById('container')!

  editor = monaco.editor.create(container, {
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

  async function format() {
    model.setValue((await formatCode(props.code, lang())).trim())
  }

  model.onDidChangeContent(() => {
    onCodeChange(model.getValue().toString())
  })

  // ctrl+s to format
  editor.onKeyDown((e) => {
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
      e.preventDefault()
      format()
    }
  })

  update = () => {
    monaco.editor.setTheme(props.dark
      ? theme.dark || 'vitesse-dark'
      : theme.light || 'vitesse-light',
    )
    styleObject.innerHTML = `:root { ${props.style} }`

    if (editor.getValue().toString() !== props.code) {
      const selection = editor.getSelection()
      editor.setValue(props.code)
      if (selection)
        editor.setSelection(selection)
    }
  }

  function onCodeChange(code: string) {
    props.code = code
    if (window.parent === window)
      return

    window.parent.postMessage(
      {
        type: 'slidev-monaco',
        id: props.id,
        data: { code },
      },
      location.origin,
    )
  }

  update()
}

window.addEventListener('message', (payload) => {
  if (payload.source === window)
    return
  if (payload.origin !== location.origin)
    return
  if (typeof payload.data !== 'string')
    return
  const { type, data } = JSON.parse(payload.data)
  if (type === 'slidev-monaco') {
    Object.assign(props, data)
    update()
  }
})

start()
