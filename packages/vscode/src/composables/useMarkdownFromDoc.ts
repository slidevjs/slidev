import { slash } from '@antfu/utils'
import type { MaybeRefOrGetter } from '@vue/runtime-core'
import { computed, toValue } from '@vue/runtime-core'
import type { TextDocument } from 'vscode'
import { projects } from '../projects'

export function getMarkdownFromDoc(doc: TextDocument | undefined) {
  if (!doc)
    return null
  const path = slash(doc.uri.fsPath)
  for (const project of projects.values()) {
    const md = project.data.markdownFiles[path]
    if (md)
      return md
  }
  return null
}

export function useMarkdownFromDoc(doc: MaybeRefOrGetter<TextDocument | undefined>) {
  return computed(() => getMarkdownFromDoc(toValue(doc)))
}
