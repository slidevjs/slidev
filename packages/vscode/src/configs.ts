import type { ConfigType } from 'reactive-vscode'
import { computed, defineConfigs, ref } from 'reactive-vscode'

export const {
  'force-enabled': forceEnabled,
  'port': configuredPortInitial,
  'annotations': displayAnnotations,
  'preview-sync': previewSyncInitial,
  include,
  exclude,
  'dev-command': devCommand,
  'mcp.port': mcpPort,
  'mcp.ide': mcpIDE,
} = defineConfigs('slidev', {
  'force-enabled': Boolean,
  'port': Number,
  'annotations': Boolean,
  'preview-sync': Boolean,
  'include': Object as ConfigType<string[]>,
  'exclude': String,
  'dev-command': String,
  'mcp.port': Number,
  'mcp.ide': Object as ConfigType<'vscode' | 'cursor' | undefined>,
})

export const configuredPort = ref(configuredPortInitial)
export const previewSync = ref(previewSyncInitial)
export const mcpUrl = computed(() => {
  const port = mcpPort.value
  return `http://localhost:${port}`
})
