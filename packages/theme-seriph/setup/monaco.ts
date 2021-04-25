import * as monaco from 'monaco-editor'

export default async function setupMonaco() {
  const { default: light } = await import('theme-vitesse/themes/vitesse-light.json')
  light.colors['editor.background'] = '#00000000'
  monaco.editor.defineTheme('vitesse-light', light as any)
}
