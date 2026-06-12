import { defineConfig } from 'cypress'
import { assertBasePathNavigation, startBasePathServer, stopBasePathServer } from './cypress/basePathServer'

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:4173/deck',
    chromeWebSecurity: false,
    specPattern: 'cypress/e2e/examples/base-path.spec.ts',
    supportFile: false,
    async setupNodeEvents(on, config) {
      on('after:run', stopBasePathServer)
      on('task', {
        assertBasePathNavigation,
        startBasePathServer,
        stopBasePathServer,
      })
      await startBasePathServer()
      return config
    },
  },
})
