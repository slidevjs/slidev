import { existsSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { slash } from '@antfu/utils'
import type { LoadedSlidevData } from '@slidev/parser/fs'
import { load } from '@slidev/parser/fs'
import { watch } from '@vue/runtime-core'
import { computed, markRaw, onScopeDispose, reactive, ref, useVscodeContext, watchEffect } from 'reactive-vscode'
import { window, workspace } from 'vscode'
import { exclude, forceEnabled, include } from './configs'
import { findShallowestPath } from './utils/findShallowestPath'
import { logger } from './views/logger'

export interface SlidevProject {
  readonly entry: string
  readonly userRoot: string
  data: LoadedSlidevData
  port: number | null
}

export const projects = reactive(new Map<string, SlidevProject>())
export const activeEntry = ref<string | null>(null)
export const activeProject = computed(() => activeEntry.value ? projects.get(activeEntry.value) : undefined)
export const activeSlidevData = computed(() => activeProject.value?.data)
export const activeUserRoot = computed(() => activeProject.value?.userRoot)

async function addExistingProjects() {
  const files = new Set<string>()
  for (const glob of include.value) {
    (await workspace.findFiles(glob, exclude.value))
      .forEach(file => files.add(file.fsPath))
  }
  for (const file of files) {
    const path = slash(file)
    if (!projects.has(path))
      (await addProjectEffect(path))()
  }
}

export async function rescanProjects() {
  await addExistingProjects()
  for (const project of projects.values()) {
    if (!existsSync(project.entry)) {
      projects.delete(project.entry)
      if (activeEntry.value === project.entry)
        activeEntry.value = null
    }
  }
  await autoSetActiveEntry()
}

export function useProjects() {
  async function init() {
    await addExistingProjects()
    await autoSetActiveEntry()
  }
  init()

  // In case all the projects are removed manually, and the user may not want to disable the extension.
  const everHadProjects = ref(false)
  watchEffect(() => {
    if (projects.size > 0)
      everHadProjects.value = true
  })

  useVscodeContext('slidev:enabled', () => {
    const enabled = forceEnabled.value == null ? everHadProjects.value : forceEnabled.value
    logger.info(`Slidev ${enabled ? 'enabled' : 'disabled'}.`)
    return enabled
  })
  useVscodeContext('slidev:hasActiveProject', () => !!activeEntry.value)

  let pendingUpdate: { cancelled: boolean } | null = null

  const fsWatcher = workspace.createFileSystemWatcher('**/*.md')
  onScopeDispose(() => fsWatcher.dispose())

  fsWatcher.onDidChange(async (uri) => {
    const path = slash(uri.fsPath).toLowerCase()
    logger.info(`File ${path} changed.`)
    const startMs = Date.now()
    pendingUpdate && (pendingUpdate.cancelled = true)
    const thisUpdate = pendingUpdate = { cancelled: false }
    const effects: (() => void)[] = []
    for (const project of projects.values()) {
      if (!project.data.watchFiles.some(f => f.toLowerCase() === path))
        continue

      if (existsSync(project.entry)) {
        const newData = markRaw(await load(project.userRoot, project.entry))
        effects.push(() => {
          project.data = newData
          logger.info(`Project ${project.entry} updated.`)
        })
      }

      if (thisUpdate.cancelled)
        return
    }

    effects.map(effect => effect())
    logger.info(`All affected Slidev projects updated in ${Date.now() - startMs}ms.`)
  })
  fsWatcher.onDidCreate(rescanProjects)
  fsWatcher.onDidDelete(rescanProjects)

  watch(include, rescanProjects)
}

export async function addProject(entry: string) {
  if (projects.has(entry)) {
    window.showErrorMessage('Cannot add slides entry: This Markdown has already been a entry.')
    return
  }
  (await addProjectEffect(entry))()
  autoSetActiveEntry()
}

async function addProjectEffect(entry: string) {
  const userRoot = dirname(entry)
  const data = markRaw(await load(userRoot, entry))
  return () => {
    const existing = projects.get(entry)
    if (existing) {
      existing.data = data
    }
    else {
      projects.set(entry, {
        entry,
        userRoot,
        data,
        port: null,
      })
    }
  }
}

async function autoSetActiveEntry() {
  if (!activeEntry.value) {
    const firstKind = findShallowestPath(
      [...projects.keys()].filter(path => basename(path) === 'slides.md'),
    )
    if (firstKind) {
      activeEntry.value = firstKind
      return
    }
    const secondKind = findShallowestPath(projects.keys())
    if (secondKind)
      activeEntry.value = secondKind
  }
}
