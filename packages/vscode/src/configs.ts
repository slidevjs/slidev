import type { ConfigType } from 'reactive-vscode'
import { defineConfigs } from 'reactive-vscode'

export const {
  'force-enabled': forceEnabled,
  'port': configuredPort,
  'annotations': displayAnnotations,
  'preview-sync': previewSync,
  include,
  exclude,
} = defineConfigs('slidev', {
  'force-enabled': Boolean,
  'port': Number,
  'annotations': Boolean,
  'preview-sync': Boolean,
  'include': Object as ConfigType<string[]>,
  'exclude': String,
})
