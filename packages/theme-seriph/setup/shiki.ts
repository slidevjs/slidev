import { defineShikiSetup } from '@slidev/types'
import { loadTheme } from 'shiki'

export default defineShikiSetup(async() => {
  return {
    theme: {
      dark: await loadTheme(require.resolve('theme-vitesse/themes/vitesse-dark.json')),
      light: await loadTheme(require.resolve('theme-vitesse/themes/vitesse-light.json')),
    },
  }
})
