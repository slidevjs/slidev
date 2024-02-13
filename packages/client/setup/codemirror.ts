import type { Ref, WritableComputedRef } from 'vue'
import { watch } from 'vue'
import * as _CodeMirror from 'codemirror'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/css/css'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/mode/xml/xml'
import 'codemirror/mode/htmlmixed/htmlmixed'
import 'codemirror/addon/display/placeholder'
import 'codemirror/lib/codemirror.css'

// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
const CodeMirror: typeof _CodeMirror = _CodeMirror.fromTextArea ? _CodeMirror : globalThis.CodeMirror

export async function useCodeMirror(
  textarea: Ref<HTMLTextAreaElement | null | undefined>,
  input: Ref<string> | WritableComputedRef<string>,
  options: CodeMirror.EditorConfiguration = {},
) {
  const cm = CodeMirror.fromTextArea(
    textarea.value!,
    {
      theme: 'vars',
      ...options,
    },
  )

  let skip = false

  cm.on('change', () => {
    if (skip) {
      skip = false
      return
    }
    input.value = cm.getValue()
  })

  watch(
    input,
    (v) => {
      if (v !== cm.getValue()) {
        skip = true
        const selections = cm.listSelections()
        cm.replaceRange(v, cm.posFromIndex(0), cm.posFromIndex(Number.POSITIVE_INFINITY))
        cm.setSelections(selections)
      }
    },
    { immediate: true },
  )

  return cm
}
