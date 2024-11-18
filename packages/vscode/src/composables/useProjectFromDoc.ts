import type { MaybeRefOrGetter } from 'reactive-vscode'
import type { TextDocument } from 'vscode'
import { slash } from '@antfu/utils'
import { computed, toValue } from 'reactive-vscode'
import { activeProject, projects } from '../projects'

export function getProjectFromDoc(doc: TextDocument | undefined) {
  if (!doc)
    return null
  const path = slash(doc.uri.fsPath)
  const md = activeProject.value?.data.markdownFiles[path]
  if (md)
    return { project: activeProject.value!, md }
  for (const project of projects.values()) {
    const md = project.data.markdownFiles[path]
    if (md)
      return { project, md }
  }
  return null
}

export function useProjectFromDoc(doc: MaybeRefOrGetter<TextDocument | undefined>) {
  return computed(() => getProjectFromDoc(toValue(doc)))
}
