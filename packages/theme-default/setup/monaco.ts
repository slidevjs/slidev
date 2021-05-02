import { defineMonacoSetup } from '@slidev/types'

export default defineMonacoSetup(async(monaco) => {
  await Promise.all([
    // load theme
    (async() => {
      const { default: dark } = await import('theme-vitesse/themes/vitesse-dark.json')
      const { default: light } = await import('theme-vitesse/themes/vitesse-light.json')

      light.colors['editor.background'] = '#00000000'
      dark.colors['editor.background'] = '#00000000'

      monaco.editor.defineTheme('vitesse-light', light as any)
      monaco.editor.defineTheme('vitesse-dark', dark as any)
    })(),
  ])
})
