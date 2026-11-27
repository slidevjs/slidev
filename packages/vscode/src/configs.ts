import { defineConfig } from 'reactive-vscode'

export const config = defineConfig<{
  'force-enabled': boolean
  'port': number
  'annotations': boolean
  'annotations-line-numbers': boolean
  'preview-sync': boolean
  'include': string[]
  'exclude': string
  'dev-command': string
}>('slidev')
