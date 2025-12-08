import type { LoadedSlidevData } from '@slidev/parser/fs'
import type { ComputedRef, EffectScope, Ref, ShallowRef } from 'reactive-vscode'
import type { SlidevServer } from './composables/useDevServer'
import type { DetectedServerState } from './composables/useServerDetector'
import { existsSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { debounce, slash } from '@antfu/utils'
import { load } from '@slidev/parser/fs'
import { isMatch } from 'picomatch'
import { computed, effectScope, extensionContext, markRaw, onScopeDispose, ref, shallowReactive, shallowRef, useDisposable, useFsWatcher, useVscodeContext, watch, watchEffect } from 'reactive-vscode'
import { FileSystemError, Uri, window, workspace } from 'vscode'
import { useServerDetector } from './composables/useServerDetector'
import { exclude, forceEnabled, include } from './configs'
import { findShallowestPath } from './utils/findShallowestPath'
import { logger } from './views/logger'

export interface SlidevProject {
  readonly scope: EffectScope
  readonly entry: string
  readonly userRoot: string
  readonly data: LoadedSlidevData
  readonly port: Ref<number | null>
  readonly server: ShallowRef<SlidevServer | null>
  readonly detected: ComputedRef<DetectedServerState | null>
}

export const projects = shallowReactive(new Map<string, SlidevProject>())
export const slidevFiles = computed(() => [...projects.values()].flatMap(p => Object.keys(p.data.markdownFiles)))
export const activeEntry = ref<string | null>(null)
export const activeProject = computed(() => activeEntry.value ? projects.get(activeEntry.value) : undefined)
export const activeData = computed(() => activeProject.value?.data)

export function useProjects() {
  const watcher = useFsWatcher(include, false, true, false)
  watcher.onDidCreate(async (uri) => {
    const path = slash(uri.fsPath)
    if (!isMatch(path, exclude.value))
      await addProject(path)
  })
  watcher.onDidDelete(async (uri) => {
    removeProject(slash(uri.fsPath))
  })

  rescanProjects()
  watch([include, exclude], debounce(200, rescanProjects))

  // In case all the projects are removed manually, and the user may not want to disable the extension.
  const everHadProjects = ref(false)
  watchEffect(() => {
    if (projects.size > 0)
      everHadProjects.value = true
  })

  // Save active project to workspace state
  watchEffect(() => {
    if (activeEntry.value)
      extensionContext.value!.workspaceState.update('slidev:activeProject', activeEntry.value)
  })

  // Auto set active project
  watch(() => [...projects.keys(), activeEntry.value], () => {
    if (!activeEntry.value) {
      const previous = extensionContext.value!.workspaceState.get('slidev:activeProject', null)
      if (previous && projects.has(previous)) {
        activeEntry.value = previous
        return
      }
      const firstKind = findShallowestPath(
        [...projects.keys()].filter(path => basename(path) === 'slides.md'),
      )
      if (firstKind) {
        activeEntry.value = firstKind
        return
      }
      const secondKind = findShallowestPath(projects.keys())
      if (secondKind) {
        activeEntry.value = secondKind
      }
    }
  }, { immediate: true })

  useVscodeContext('slidev:enabled', () => {
    const enabled = forceEnabled.value == null ? everHadProjects.value : forceEnabled.value
    logger.info(`Slidev ${enabled ? 'enabled' : 'disabled'}.`)
    return enabled
  })
  useVscodeContext('slidev:hasActiveProject', () => !!activeEntry.value)

  onScopeDispose(() => {
    for (const project of projects.values()) {
      project.scope.stop()
    }
    projects.clear()
  })
}

let scanningProjects = false
export const scannedProjects = ref(false)
export async function rescanProjects() {
  if (scanningProjects)
    return
  scanningProjects = true
  try {
    const entries = new Set<string>()
    for (const glob of include.value) {
      (await workspace.findFiles(glob, exclude.value))
        .forEach(file => entries.add(file.fsPath))
    }
    for (const entry of entries) {
      await addProject(slash(entry))
    }
    for (const project of projects.values()) {
      if (!existsSync(project.entry)) {
        removeProject(project.entry)
      }
    }
  }
  finally {
    scanningProjects = false
    scannedProjects.value = true
  }
}

export async function addProject(entry: string) {
  if (projects.has(entry))
    return projects.get(entry)!

  const { getDetected } = useServerDetector()

  const scope = effectScope(true)
  const data = shallowRef<LoadedSlidevData>(await loadProject(entry))
  const project: SlidevProject = {
    scope,
    entry,
    userRoot: dirname(entry),
    get data() {
      return data.value
    },
    server: shallowRef(null),
    port: ref(null),
    detected: computed(() => getDetected(project)),
  }

  scope.run(() => {
    // Handle changes. VSCode already debounces rapid changes itself.
    let pendingReload: Promise<LoadedSlidevData> | null = null
    useDisposable(workspace.onDidChangeTextDocument(async ({ document }) => {
      const path = slash(document.uri.fsPath)
      if (data.value?.watchFiles[path]) {
        const thisReload = pendingReload = loadProject(entry)
        const newData = await thisReload
        if (pendingReload === thisReload) { // still the latest
          data.value = newData
          pendingReload = null
        }
      }
    }))

    useDisposable(workspace.onDidCloseTextDocument(async (document) => {
      const path = slash(document.uri.fsPath)
      if (path !== entry) {
        return
      }
      try {
        await workspace.fs.stat(document.uri)
      }
      catch (err) {
        if (err instanceof FileSystemError && err.code === 'FileNotFound') {
          removeProject(entry)
        }
      }
    }))

    onScopeDispose(() => {
      projects.get(entry)?.server.value?.scope.stop()
    })
  })

  projects.set(entry, project)
  return project
}

export function removeProject(entry: string) {
  const project = projects.get(entry)
  if (!project)
    return
  if (activeEntry.value === entry)
    activeEntry.value = null
  project.scope.stop()
  projects.delete(entry)
}

async function loadProject(entry: string) {
  const userRoot = dirname(entry)
  return markRaw(await load(userRoot, entry, async (path: string) => {
    const document = workspace.textDocuments.find(d => slash(d.uri.fsPath) === path)
    if (document) {
      return document.getText()
    }
    const buffer = await workspace.fs.readFile(Uri.file(path))
    return (new TextDecoder('utf-8')).decode(buffer)
  }))
}

const ignoredEntries = new Set<string>()
export async function askAddProject(entry: string, message: string) {
  if (projects.has(entry) || ignoredEntries.has(entry))
    return
  if (!workspace.getWorkspaceFolder(Uri.file(entry))) {
    return
  }
  const result = await window.showInformationMessage(`${message}\nDo you want to add ${entry} as a Slidev project?`, 'Yes', 'No')
  if (result === 'Yes') {
    await addProject(entry)
  }
  else {
    ignoredEntries.add(entry)
  }
}
