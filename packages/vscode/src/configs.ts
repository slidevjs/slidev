import { defineConfigs } from 'reactive-vscode'

export const {
  'force-enabled': forceEnabled,
  'port': configuredPort,
  'annotations': displayAnnotations,
  'preview-sync': previewSync,
} = defineConfigs('slidev', {
  'force-enabled': Boolean,
  'port': Number,
  'annotations': Boolean,
  'preview-sync': Boolean,
})
