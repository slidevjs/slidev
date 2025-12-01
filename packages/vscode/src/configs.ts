import type { ConfigType } from 'reactive-vscode'
import { defineConfigs } from 'reactive-vscode'

export const {
  'force-enabled': forceEnabled,
  'port': configuredPort,
  'annotations': displayAnnotations,
  'annotations-line-numbers': displayCodeBlockLineNumbers,
  'preview-sync': previewSync,
  include,
  exclude,
  'dev-command': devCommand,
} = defineConfigs('slidev', {
  'force-enabled': Boolean,
  'port': Number,
  'annotations': Boolean,
  'annotations-line-numbers': Boolean,
  'preview-sync': Boolean,
  'include': Object as ConfigType<string[]>,
  'exclude': String,
  'dev-command': String,
})
