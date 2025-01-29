import type { ConfigType } from 'reactive-vscode'
import { defineConfigs, ref } from 'reactive-vscode'

export const {
  'force-enabled': forceEnabled,
  'port': configuredPortInitial,
  'annotations': displayAnnotations,
  'preview-sync': previewSyncInitial,
  include,
  exclude,
  'dev-command': devCommand,
} = defineConfigs('slidev', {
  'force-enabled': Boolean,
  'port': Number,
  'annotations': Boolean,
  'preview-sync': Boolean,
  'include': Object as ConfigType<string[]>,
  'exclude': String,
  'dev-command': String,
})

export const configuredPort = ref(configuredPortInitial)
export const previewSync = ref(previewSyncInitial)
