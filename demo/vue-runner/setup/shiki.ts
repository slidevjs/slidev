import type { ShikiSetupReturn } from '@slidev/types'
import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup((): ShikiSetupReturn => {
  return {
    langs: [
      'ts',
      'js',
      'vue',
      'html',
    ],
  }
})
