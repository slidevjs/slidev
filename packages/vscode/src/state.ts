import { computed, ref, shallowRef } from '@vue/runtime-core'
import type { ExtensionContext } from 'vscode'
import { workspace } from 'vscode'
import { configuredPort } from './config'

export const extCtx = shallowRef<ExtensionContext>(undefined!)

export const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath ?? ''

export const detectedPort = ref<number | null>(null)
export const previewPort = computed(() => detectedPort.value ?? configuredPort.value)
export const previewOrigin = computed(() => `http://localhost:${previewPort.value}`)
export const previewUrl = computed(() => `${previewOrigin.value}?embedded=true`)
